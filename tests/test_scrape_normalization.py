from pipeline.scrape import normalize_html_to_text, scrape_seed_sources


def test_normalize_html_to_text_removes_script_and_nav():
    html = """
    <html>
      <head>
        <title>Sample Page</title>
        <script>console.log("ignore me")</script>
        <style>body { color: red; }</style>
      </head>
      <body>
        <nav>Primary navigation</nav>
        <main>
          <h1>Alpha</h1>
          <p>Beta paragraph.</p>
          <noscript>Also ignore</noscript>
        </main>
        <footer>Footer links</footer>
      </body>
    </html>
    """

    assert normalize_html_to_text(html) == "Sample Page\n\nAlpha\nBeta paragraph."


def test_normalize_html_to_text_title_only_does_not_duplicate_title():
    html = """
    <html>
      <head>
        <title>Lonely Title</title>
      </head>
    </html>
    """

    assert normalize_html_to_text(html) == "Lonely Title"


def test_scrape_seed_sources_classifies_http_errors(monkeypatch):
    class FakeResponse:
        ok = False
        status_code = 404
        url = "https://example.com/final"
        headers = {"Content-Type": "text/html"}
        text = """
        <html>
          <head><title>Missing</title></head>
          <body><p>Not found</p></body>
        </html>
        """

    class FakeCursor:
        def __init__(self):
            self.calls = []
            self.rowcount = 0

        def execute(self, sql, params=None):
            self.calls.append((sql, params))
            if "SELECT id, source_urls" in sql:
                self._rows = [(7, ["https://example.com/missing"])]
                return
            self.rowcount = 1

        def fetchall(self):
            return getattr(self, "_rows", [])

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    class FakeConnection:
        def __init__(self):
            self.cursor_obj = FakeCursor()
            self.committed = False

        def cursor(self):
            return self.cursor_obj

        def commit(self):
            self.committed = True

        def __enter__(self):
            return self

        def __exit__(self, exc_type, exc, tb):
            return False

    fake_connection = FakeConnection()

    monkeypatch.setattr("pipeline.scrape.connect", lambda config: fake_connection)
    monkeypatch.setattr(
        "pipeline.scrape.fetch_url",
        lambda config, url: FakeResponse(),
    )

    inserted = scrape_seed_sources(object())

    assert inserted == 1
    insert_sql, insert_params = fake_connection.cursor_obj.calls[-1]
    assert "INSERT INTO ingestion.source_documents" in insert_sql
    assert insert_params[3] == "http_error"
    assert insert_params[10] == "HTTP 404"
    assert fake_connection.committed is True

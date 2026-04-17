from pipeline.chunking import build_chunks, chunk_pending_documents, estimate_tokens


def test_estimate_tokens_is_deterministic():
    assert estimate_tokens("abcd") == 1
    assert estimate_tokens("a" * 400) == 100


def test_build_chunks_preserves_order_and_overlap():
    text = ("Paragraph one.\n\n" * 40) + ("Paragraph two.\n\n" * 40)

    chunks = build_chunks(text, target_chars=200, overlap_chars=20)

    assert len(chunks) >= 2
    assert chunks[0]["chunk_index"] == 0
    assert chunks[0]["char_start"] == 0
    assert chunks[0]["char_end"] > chunks[0]["char_start"]
    assert chunks[0]["chunk_text"] == text[: chunks[0]["char_end"]]
    assert chunks[0]["token_estimate"] == estimate_tokens(chunks[0]["chunk_text"])
    assert len(chunks[0]["chunk_hash"]) == 64

    assert chunks[1]["chunk_index"] == 1
    assert chunks[1]["char_start"] < chunks[0]["char_end"]
    overlap_text = text[chunks[1]["char_start"] : chunks[0]["char_end"]]
    assert overlap_text == chunks[0]["chunk_text"][-len(overlap_text) :]
    assert overlap_text == chunks[1]["chunk_text"][: len(overlap_text)]
    assert chunks[1]["chunk_text"] == text[
        chunks[1]["char_start"] : chunks[1]["char_end"]
    ]
    assert chunks[-1]["char_end"] == len(text)


def test_chunk_pending_documents_inserts_chunks_in_order(monkeypatch):
    class FakeCursor:
        def __init__(self):
            self.calls = []
            self.inserted_indexes = []
            self.rowcount = 0

        def execute(self, sql, params=None):
            self.calls.append((sql, params))
            if params is None:
                self._rows = [(11, "abcdefghij")]
                return
            self.inserted_indexes.append(params[1])
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

    class FakeConfig:
        chunk_target_chars = 5
        chunk_overlap_chars = 2

    fake_connection = FakeConnection()
    monkeypatch.setattr("pipeline.chunking.connect", lambda config: fake_connection)

    inserted = chunk_pending_documents(FakeConfig())

    assert inserted == 3
    assert fake_connection.cursor_obj.inserted_indexes == [0, 1, 2]
    assert [params[1] for _, params in fake_connection.cursor_obj.calls if params is not None] == [0, 1, 2]
    assert fake_connection.committed is True


def test_chunk_pending_documents_retries_partial_documents(monkeypatch):
    class FakeCursor:
        def __init__(self):
            self.calls = []
            self.rowcount = 0
            self.inserted_indexes = []

        def execute(self, sql, params=None):
            self.calls.append((sql, params))
            if params is None:
                self._rows = [(21, "abcdefghij")]
                return

            self.inserted_indexes.append(params[1])
            self.rowcount = 0 if params[1] == 0 else 1

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

    class FakeConfig:
        chunk_target_chars = 5
        chunk_overlap_chars = 2

    fake_connection = FakeConnection()
    monkeypatch.setattr("pipeline.chunking.connect", lambda config: fake_connection)

    inserted = chunk_pending_documents(FakeConfig())

    assert inserted == 2
    assert fake_connection.cursor_obj.inserted_indexes == [0, 1, 2]
    assert fake_connection.committed is True

"""Deterministic scraping helpers for ingestion source documents."""

from __future__ import annotations

import hashlib
from collections.abc import Iterable
from typing import Any

import requests
from bs4 import BeautifulSoup

from .config import PipelineConfig
from .db import connect

DEFAULT_FETCH_TIMEOUT_SECONDS = 20
_BOILERPLATE_TAGS = ("script", "style", "noscript", "nav", "footer")


def normalize_html_to_text(html: str) -> str:
    """Remove boilerplate and return normalized readable text.

    The title is preserved at the top when present so the output remains
    stable and useful for downstream review.
    """

    soup = BeautifulSoup(html, "html.parser")
    title = _extract_title(soup)

    for tag_name in _BOILERPLATE_TAGS:
        for tag in soup.find_all(tag_name):
            tag.decompose()

    body = soup.body if soup.body is not None else soup
    text = body.get_text("\n", strip=True)
    cleaned_lines = [line.strip() for line in text.splitlines()]
    cleaned_text = "\n".join(line for line in cleaned_lines if line)

    if title:
        if not cleaned_text:
            return title
        if soup.body is None and (
            cleaned_text == title or cleaned_text.startswith(f"{title}\n")
        ):
            return cleaned_text
        return f"{title}\n\n{cleaned_text}"
    return cleaned_text


def compute_content_hash(text: str) -> str:
    """Return a deterministic SHA-256 hash for *text*."""

    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def fetch_url(config: PipelineConfig, url: str) -> requests.Response:
    """Fetch *url* with a fixed user agent and timeout."""

    headers = {"User-Agent": config.scraper_user_agent}
    return requests.get(url, headers=headers, timeout=DEFAULT_FETCH_TIMEOUT_SECONDS)


def scrape_seed_sources(config: PipelineConfig) -> int:
    """Fetch every seed URL and store normalized source documents."""

    inserted = 0

    with connect(config) as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT id, source_urls FROM ingestion.seed_sources ORDER BY id")
            rows = cursor.fetchall()

            for seed_source_id, source_urls in rows:
                for source_url in _iter_source_urls(source_urls):
                    try:
                        response = fetch_url(config, source_url)
                        raw_html = response.text
                        clean_text = normalize_html_to_text(raw_html)
                        title = _extract_title(raw_html)
                        content_hash = compute_content_hash(clean_text)
                        http_status = response.status_code
                        canonical_url = str(response.url)
                        content_type = response.headers.get("Content-Type")
                        last_error = None
                        fetch_status = "success" if response.ok else "http_error"
                        if not response.ok:
                            last_error = f"HTTP {response.status_code}"
                    except requests.RequestException as exc:
                        raw_html = None
                        clean_text = None
                        title = None
                        content_hash = None
                        fetch_status = "error"
                        http_status = None
                        canonical_url = None
                        content_type = None
                        last_error = str(exc)

                    cursor.execute(
                        """
                        INSERT INTO ingestion.source_documents (
                          seed_source_id, source_url, canonical_url, fetch_status, http_status,
                          content_type, title, raw_html, clean_text, content_hash, last_error
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT DO NOTHING
                        """,
                        (
                            seed_source_id,
                            source_url,
                            canonical_url,
                            fetch_status,
                            http_status,
                            content_type,
                            title,
                            raw_html,
                            clean_text,
                            content_hash,
                            last_error,
                        ),
                    )
                    inserted += cursor.rowcount

        connection.commit()

    return inserted


def _extract_title(soup_or_html: BeautifulSoup | str) -> str | None:
    """Return the normalized document title when one exists."""

    if isinstance(soup_or_html, str):
        soup = BeautifulSoup(soup_or_html, "html.parser")
    else:
        soup = soup_or_html

    if soup.title is None:
        return None

    title_text = soup.title.get_text(" ", strip=True)
    return title_text or None


def _iter_source_urls(source_urls: Any) -> Iterable[str]:
    if source_urls is None:
        return []
    if isinstance(source_urls, str):
        return [source_urls]
    return [str(url) for url in source_urls if url]

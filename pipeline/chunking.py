"""Deterministic chunking helpers for ingestion source documents."""

from __future__ import annotations

import hashlib
from collections.abc import Iterable
from typing import TYPE_CHECKING, Any

from .db import connect

if TYPE_CHECKING:
    from .config import PipelineConfig


def estimate_tokens(text: str) -> int:
    """Return a simple deterministic token estimate for *text*."""

    return max(1, len(text) // 4)


def build_chunks(
    text: str, target_chars: int, overlap_chars: int
) -> list[dict[str, Any]]:
    """Split *text* into deterministic overlapping chunks.

    The chunks preserve the input order, repeat the configured overlap between
    neighbors, and include stable metadata for downstream storage.
    """

    if target_chars <= 0:
        raise ValueError("target_chars must be greater than 0")
    if overlap_chars < 0:
        raise ValueError("overlap_chars must be at least 0")
    if overlap_chars >= target_chars:
        raise ValueError("overlap_chars must be smaller than target_chars")
    if not text.strip():
        return []

    chunks: list[dict[str, Any]] = []
    text_length = len(text)
    start = 0

    while start < text_length:
        end = min(text_length, start + target_chars)
        chunk_text = text[start:end]
        chunks.append(
            {
                "chunk_index": len(chunks),
                "char_start": start,
                "char_end": end,
                "token_estimate": estimate_tokens(chunk_text),
                "chunk_text": chunk_text,
                "chunk_hash": hashlib.sha256(chunk_text.encode("utf-8")).hexdigest(),
            }
        )
        if end >= text_length:
            break
        start = end - overlap_chars

    return chunks


def chunk_pending_documents(config: PipelineConfig) -> int:
    """Chunk all source documents and store deterministic chunks.

    The operation is resumable because each chunk insert is keyed by
    ``(source_document_id, chunk_index)`` and uses ``ON CONFLICT DO NOTHING``.
    """

    inserted = 0

    with connect(config) as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT sd.id, sd.clean_text
                FROM ingestion.source_documents sd
                WHERE sd.clean_text IS NOT NULL
                  AND btrim(sd.clean_text) <> ''
                ORDER BY sd.id
                """
            )
            rows: Iterable[tuple[int, str]] = cursor.fetchall()

            for source_document_id, clean_text in rows:
                for chunk in build_chunks(
                    clean_text,
                    target_chars=config.chunk_target_chars,
                    overlap_chars=config.chunk_overlap_chars,
                ):
                    cursor.execute(
                        """
                        INSERT INTO ingestion.document_chunks (
                          source_document_id, chunk_index, char_start, char_end,
                          token_estimate, chunk_text, chunk_hash
                        )
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (source_document_id, chunk_index) DO NOTHING
                        """,
                        (
                            source_document_id,
                            chunk["chunk_index"],
                            chunk["char_start"],
                            chunk["char_end"],
                            chunk["token_estimate"],
                            chunk["chunk_text"],
                            chunk["chunk_hash"],
                        ),
                    )
                    inserted += cursor.rowcount

        connection.commit()

    return inserted

from __future__ import annotations

from pipeline.extract import (
    LoadedChunk,
    _build_prompt,
    _build_claim_synthesis_prompt,
    _document_looks_like_listing,
    _expand_loaded_chunks,
    _hydrate_fragment,
    _map_frontend_source_type,
)


def test_build_prompt_includes_existing_fragments_and_frontend_domains():
    prompt = _build_prompt(
        anchor_chunk_id=10,
        loaded_chunks=[
            LoadedChunk(chunk_id=10, chunk_index=3, chunk_text="Anchor text."),
            LoadedChunk(chunk_id=11, chunk_index=4, chunk_text="Right neighbor."),
        ],
        source_context={
            "label": "Case A-17",
            "trial_program": "UX111",
            "treatment_status": "treated",
        },
        existing_fragments=[
            {
                "title": "Existing recognition fragment",
                "excerpt": "existing evidence",
                "signal_domain": "recognition",
            }
        ],
    )

    assert "Existing evidence fragments for this anchor chunk" in prompt
    assert "Loaded chunks" in prompt
    assert "Anchor chunk id: 10" in prompt
    assert "Emit only the strongest evidence fragments" in prompt
    assert "Do not return `source_type` or `modality`" in prompt
    assert "If `treatment_status` is `treated`" in prompt
    assert "vocabulary" in prompt
    assert "recognition" in prompt
    assert "Anchor text." in prompt
    assert "Right neighbor." in prompt


def test_build_claim_synthesis_prompt_mentions_trend_and_fragment_ids():
    prompt = _build_claim_synthesis_prompt(
        case_record={
            "case_id": "case-a",
            "label": "Case A-17",
            "trial_program": "UX111",
            "treatment_status": "treated",
        },
        fragments=[
            {
                "id": "FRG-1",
                "date": "2026-02-11",
                "source_type": "Parent Journal",
                "title": "Recognition check during visit",
                "excerpt": "Turned toward aunt's voice immediately.",
                "signal_domain": "recognition",
                "confidence": "high",
            }
        ],
    )

    assert "stable" in prompt
    assert "fragment_ids" in prompt
    assert "Recognition check during visit" in prompt
    assert "treated" in prompt


def test_expand_loaded_chunks_adds_next_right_neighbor():
    loaded = [LoadedChunk(chunk_id=10, chunk_index=3, chunk_text="Anchor text.")]
    available = [
        LoadedChunk(chunk_id=9, chunk_index=2, chunk_text="Left neighbor."),
        LoadedChunk(chunk_id=11, chunk_index=4, chunk_text="Right neighbor."),
        LoadedChunk(chunk_id=12, chunk_index=5, chunk_text="Far right."),
    ]

    expanded = _expand_loaded_chunks(
        loaded_chunks=loaded,
        requested_directions=["right"],
        available_chunks=available,
    )

    assert [chunk.chunk_id for chunk in expanded] == [10, 11]


def test_map_frontend_source_type_prefers_parent_journal_for_parent_story():
    assert _map_frontend_source_type("nonprofit-family-story", "parent") == "Parent Journal"


def test_hydrate_fragment_remaps_language_loss_and_attaches_provenance_source_metadata():
    fragment = _hydrate_fragment(
        {
            "date": "2016-08-15",
            "title": "Family Isolated for 2 Years Hoping to Qualify for Daughter's Experimental Treatment - ABC News",
            "excerpt": "Eliza has lost the ability to sing her favorite song, recite her alphabet, and tell her parents I love you.",
            "tags": ["language", "loss"],
            "signal_domain": "motor",
            "confidence": "high",
            "supporting_chunk_ids": [31],
        },
        source_context={
            "recommended_source_type": "Parent Journal",
            "recommended_modality": "text",
            "document_title": "Family Isolated for 2 Years Hoping to Qualify for Daughter's Experimental Treatment - ABC News",
        },
    )

    assert fragment.signal_domain == "vocabulary"
    assert fragment.source_type == "Parent Journal"
    assert fragment.modality == "text"
    assert fragment.title != "Family Isolated for 2 Years Hoping to Qualify for Daughter's Experimental Treatment - ABC News"


def test_document_looks_like_listing_for_recent_posts_hub():
    assert _document_looks_like_listing(
        "Saving Liv — Erin Stoop | Sanfilippo Syndrome News",
        [
            LoadedChunk(
                chunk_id=8,
                chunk_index=0,
                chunk_text=(
                    "Skip to content Newsletter Search Toggle navigation Saving Liv. "
                    "Columns Screen time is a lifeline. Columns Being a Sanfilippo parent means facing impossible decisions."
                ),
            ),
            LoadedChunk(
                chunk_id=10,
                chunk_index=2,
                chunk_text=(
                    "Recent Posts Screen time is a lifeline. Explore More Columns Discussion Columns "
                    "Our respite caregiver provides much-needed help."
                ),
            ),
        ],
    )

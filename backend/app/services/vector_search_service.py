from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.services.embedding_service import (
    generate_document_embedding,
)


# Minimum cosine similarity required for a chunk
# to be considered relevant.
#
# 0.0 = completely unrelated
# 1.0 = identical semantic representation
#
# This is intentionally moderate because
# all-MiniLM-L6-v2 similarity values can vary
# significantly depending on the text.
MIN_SIMILARITY = 0.20


# Retrieve additional candidates before filtering
# and de-duplicating them.
CANDIDATE_MULTIPLIER = 3


def search_similar_chunks(
    db: Session,
    query: str,
    user_id: int,
    top_k: int = 5,
    document_ids: list[int] | None = None,
) -> list[dict]:
    """
    Search the authenticated user's document chunks
    using vector similarity.

    Retrieval pipeline:

    1. Validate the query and document scope.
    2. Generate the query embedding.
    3. Retrieve additional vector candidates.
    4. Convert cosine distance into similarity.
    5. Remove low-similarity results.
    6. Remove duplicate chunk content.
    7. Return the strongest remaining chunks.

    If document_ids are provided, retrieval is restricted
    to those documents belonging to the authenticated user.
    """

    # -----------------------------------------------------
    # 1. Validate query
    # -----------------------------------------------------

    if not query or not query.strip():
        raise ValueError(
            "Search query cannot be empty."
        )

    # -----------------------------------------------------
    # 2. Validate top_k
    # -----------------------------------------------------

    if top_k < 1:
        raise ValueError(
            "top_k must be at least 1."
        )

    # Prevent unnecessarily large result requests.
    top_k = min(top_k, 20)

    # -----------------------------------------------------
    # 3. Validate document IDs
    # -----------------------------------------------------

    if document_ids is not None:
        if not document_ids:
            return []

        if any(
            not isinstance(document_id, int)
            or document_id <= 0
            for document_id in document_ids
        ):
            raise ValueError(
                "document_ids must contain valid "
                "positive integers."
            )

        # Remove duplicate IDs while preserving order.
        document_ids = list(
            dict.fromkeys(document_ids)
        )

    # -----------------------------------------------------
    # 4. Generate query embedding
    # -----------------------------------------------------

    query_embedding = (
        generate_document_embedding(
            query.strip()
        )
    )

    # -----------------------------------------------------
    # 5. Calculate cosine distance
    # -----------------------------------------------------

    distance = (
        DocumentChunk.embedding.cosine_distance(
            query_embedding
        )
    )

    # -----------------------------------------------------
    # 6. Build secure base query
    # -----------------------------------------------------

    statement = (
        select(
            DocumentChunk,
            distance.label("distance"),
        )
        .join(
            DocumentChunk.document
        )
        .where(
            DocumentChunk.embedding.is_not(None),
            DocumentChunk.document.has(
                user_id=user_id
            ),
        )
    )

    # -----------------------------------------------------
    # 7. Apply controlled document scope
    # -----------------------------------------------------

    if document_ids is not None:
        statement = statement.where(
            DocumentChunk.document_id.in_(
                document_ids
            )
        )

    # -----------------------------------------------------
    # 8. Retrieve extra candidates
    # -----------------------------------------------------
    #
    # Example:
    #
    # top_k = 5
    # candidates = 15
    #
    # This gives us enough candidates to remove weak
    # or duplicate chunks without immediately losing
    # useful context.

    candidate_limit = min(
        top_k * CANDIDATE_MULTIPLIER,
        50,
    )

    statement = (
        statement
        .order_by(distance)
        .limit(candidate_limit)
    )

    results = db.execute(
        statement
    ).all()

    # -----------------------------------------------------
    # 9. Filter and rank results
    # -----------------------------------------------------

    final_results = []

    seen_content = set()

    for chunk, distance_value in results:
        similarity = (
            1 - float(distance_value)
        )

        # ---------------------------------------------
        # Ignore weak semantic matches.
        # ---------------------------------------------

        if similarity < MIN_SIMILARITY:
            continue

        content = (
            chunk.content or ""
        ).strip()

        if not content:
            continue

        # ---------------------------------------------
        # Normalize content for duplicate detection.
        # ---------------------------------------------

        normalized_content = (
            " ".join(
                content.lower().split()
            )
        )

        if (
            normalized_content
            in seen_content
        ):
            continue

        seen_content.add(
            normalized_content
        )

        final_results.append(
            {
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "chunk_index": chunk.chunk_index,
                "content": content,
                "similarity": round(
                    similarity,
                    4,
                ),
            }
        )

        # ---------------------------------------------
        # Stop once we have enough strong results.
        # ---------------------------------------------

        if len(final_results) >= top_k:
            break

    return final_results
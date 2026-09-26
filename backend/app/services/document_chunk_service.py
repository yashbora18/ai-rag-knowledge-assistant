import logging

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.services.chunking import split_text_into_chunks
from app.services.embedding_service import (
    generate_document_embeddings,
)


logger = logging.getLogger(__name__)


EMBEDDING_BATCH_SIZE = 8


def create_document_chunks(
    db: Session,
    document_id: int,
    text: str,
) -> list[DocumentChunk]:
    """
    Split document text into chunks, generate embeddings
    in small batches, and save the chunks.

    Small batches are intentionally used to reduce memory
    consumption on low-memory deployment instances.
    """

    logger.info(
        "Starting chunk creation for document_id=%s",
        document_id,
    )

    if not text or not text.strip():
        raise ValueError(
            "Document contains no readable text."
        )

    chunks = split_text_into_chunks(
        text=text,
        chunk_size=1000,
        overlap=200,
    )

    logger.info(
        "Document %s split into %s chunks.",
        document_id,
        len(chunks),
    )

    if not chunks:
        raise ValueError(
            "Document produced no text chunks."
        )

    # Remove existing chunks for this document.
    # This makes re-processing safe.
    db.execute(
        delete(DocumentChunk).where(
            DocumentChunk.document_id
            == document_id
        )
    )

    document_chunks: list[DocumentChunk] = []

    total_chunks = len(chunks)

    for batch_start in range(
        0,
        total_chunks,
        EMBEDDING_BATCH_SIZE,
    ):
        batch_end = min(
            batch_start + EMBEDDING_BATCH_SIZE,
            total_chunks,
        )

        batch_chunks = chunks[
            batch_start:batch_end
        ]

        logger.info(
            "Generating embeddings for document %s: "
            "chunks %s-%s of %s.",
            document_id,
            batch_start + 1,
            batch_end,
            total_chunks,
        )

        embeddings = generate_document_embeddings(
            batch_chunks,
            batch_size=EMBEDDING_BATCH_SIZE,
        )

        if len(embeddings) != len(batch_chunks):
            raise RuntimeError(
                "Embedding count does not match "
                "chunk count."
            )

        for offset, (
            chunk_content,
            embedding,
        ) in enumerate(
            zip(
                batch_chunks,
                embeddings,
            )
        ):
            chunk_index = (
                batch_start + offset
            )

            document_chunk = DocumentChunk(
                document_id=document_id,
                chunk_index=chunk_index,
                content=chunk_content,
                embedding=embedding,
            )

            db.add(document_chunk)
            document_chunks.append(
                document_chunk
            )

        # Flush each batch so database memory does not
        # grow unnecessarily before the final commit.
        db.flush()

        logger.info(
            "Saved embedding batch for document %s: "
            "%s/%s chunks.",
            document_id,
            batch_end,
            total_chunks,
        )

    logger.info(
        "Finished chunk creation for document_id=%s. "
        "Total chunks=%s.",
        document_id,
        len(document_chunks),
    )

    return document_chunks
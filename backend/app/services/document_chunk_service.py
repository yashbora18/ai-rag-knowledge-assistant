from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.document_chunk import DocumentChunk
from app.services.chunking import split_text_into_chunks
from app.services.embedding_service import (
    generate_document_embedding,
)


def create_document_chunks(
    db: Session,
    document_id: int,
    text: str,
) -> list[DocumentChunk]:
    """
    Split document text into chunks, generate local embeddings,
    and save the chunks with their embeddings in the database.
    """

    chunks = split_text_into_chunks(
        text=text,
        chunk_size=1000,
        overlap=200,
    )

    # Remove existing chunks for this document.
    # This makes the operation safe if a document
    # is processed again later.
    db.execute(
        delete(DocumentChunk).where(
            DocumentChunk.document_id
            == document_id
        )
    )

    document_chunks = []

    for index, chunk_content in enumerate(
        chunks
    ):
        # Generate a 384-dimensional local embedding.
        embedding = generate_document_embedding(
            chunk_content
        )

        document_chunk = DocumentChunk(
            document_id=document_id,
            chunk_index=index,
            content=chunk_content,
            embedding=embedding,
        )

        db.add(document_chunk)
        document_chunks.append(
            document_chunk
        )

    db.flush()

    return document_chunks
from functools import lru_cache


EMBEDDING_MODEL_NAME = (
    "sentence-transformers/all-MiniLM-L6-v2"
)

EMBEDDING_DIMENSION = 384


@lru_cache(maxsize=1)
def get_embedding_model():
    """
    Load the embedding model lazily.

    The model is loaded only when an embedding
    is actually required, instead of during
    application startup.
    """

    from sentence_transformers import SentenceTransformer

    return SentenceTransformer(
        EMBEDDING_MODEL_NAME
    )


def generate_document_embedding(
    text: str,
) -> list[float]:
    """
    Generate a 384-dimensional embedding
    for a document chunk or query.
    """

    if not text or not text.strip():
        raise ValueError(
            "Cannot generate an embedding for empty text."
        )

    model = get_embedding_model()

    embedding = model.encode(
        text,
        normalize_embeddings=True,
    )

    embedding_list = embedding.tolist()

    if len(embedding_list) != EMBEDDING_DIMENSION:
        raise RuntimeError(
            f"Expected {EMBEDDING_DIMENSION}-dimensional "
            f"embedding, but received "
            f"{len(embedding_list)} dimensions."
        )

    return embedding_list
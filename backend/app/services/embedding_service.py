from sentence_transformers import SentenceTransformer


EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
EMBEDDING_DIMENSION = 384


# The model is downloaded once and then loaded locally.
model = SentenceTransformer(EMBEDDING_MODEL_NAME)


def generate_document_embedding(text: str) -> list[float]:
    """
    Generate a 384-dimensional embedding for a document chunk.
    Runs completely locally without an external API.
    """

    if not text or not text.strip():
        raise ValueError(
            "Cannot generate an embedding for empty text."
        )

    embedding = model.encode(
        text,
        normalize_embeddings=True,
    )

    embedding_list = embedding.tolist()

    if len(embedding_list) != EMBEDDING_DIMENSION:
        raise RuntimeError(
            f"Expected {EMBEDDING_DIMENSION}-dimensional embedding, "
            f"but received {len(embedding_list)} dimensions."
        )

    return embedding_list
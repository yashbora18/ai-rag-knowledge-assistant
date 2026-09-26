from functools import lru_cache
from math import sqrt


EMBEDDING_MODEL_NAME = (
    "sentence-transformers/all-MiniLM-L6-v2"
)

EMBEDDING_DIMENSION = 384


@lru_cache(maxsize=1)
def get_embedding_model():
    """
    Load the FastEmbed model lazily.

    FastEmbed uses ONNX Runtime instead of the
    PyTorch/SentenceTransformers runtime, which keeps
    memory usage much lower on small deployment instances.
    """

    from fastembed import TextEmbedding

    return TextEmbedding(
        model_name=EMBEDDING_MODEL_NAME,
        threads=1,
    )


def _normalize_embedding(
    embedding,
) -> list[float]:
    """
    Convert an embedding to a normalized Python list.
    """

    embedding_list = embedding.tolist()

    magnitude = sqrt(
        sum(
            value * value
            for value in embedding_list
        )
    )

    if magnitude > 0:
        embedding_list = [
            value / magnitude
            for value in embedding_list
        ]

    if len(embedding_list) != EMBEDDING_DIMENSION:
        raise RuntimeError(
            f"Expected {EMBEDDING_DIMENSION}-dimensional "
            f"embedding, but received "
            f"{len(embedding_list)} dimensions."
        )

    return embedding_list


def generate_document_embeddings(
    texts: list[str],
    batch_size: int = 8,
) -> list[list[float]]:
    """
    Generate normalized embeddings for multiple texts.

    Embeddings are generated in small batches to keep memory
    usage low on small deployment instances such as Render.
    """

    if not texts:
        return []

    cleaned_texts = [
        text.strip()
        for text in texts
        if text and text.strip()
    ]

    if not cleaned_texts:
        return []

    if batch_size <= 0:
        raise ValueError(
            "batch_size must be greater than 0."
        )

    model = get_embedding_model()

    embeddings = model.embed(
        cleaned_texts,
        batch_size=batch_size,
    )

    return [
        _normalize_embedding(embedding)
        for embedding in embeddings
    ]


def generate_document_embedding(
    text: str,
) -> list[float]:
    """
    Generate a single normalized embedding.

    This function is kept for compatibility with existing
    search/query code.
    """

    if not text or not text.strip():
        raise ValueError(
            "Cannot generate an embedding for empty text."
        )

    embeddings = generate_document_embeddings(
        [text],
        batch_size=1,
    )

    if not embeddings:
        raise RuntimeError(
            "Failed to generate document embedding."
        )

    return embeddings[0]
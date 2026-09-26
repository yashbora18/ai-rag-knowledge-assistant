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


def generate_document_embedding(
    text: str,
) -> list[float]:
    """
    Generate a 384-dimensional normalized embedding
    for a document chunk or query.
    """

    if not text or not text.strip():
        raise ValueError(
            "Cannot generate an embedding for empty text."
        )

    model = get_embedding_model()

    embedding = next(
        model.embed(
            [text],
            batch_size=1,
        )
    )

    embedding_list = embedding.tolist()

    magnitude = sqrt(
        sum(value * value for value in embedding_list)
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

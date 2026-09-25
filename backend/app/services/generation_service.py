import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


OLLAMA_URL = (
    "http://localhost:11434/api/generate"
)

MODEL_NAME = "llama3.2:3b"


def generate_rag_answer(
    question: str,
    retrieved_chunks: list[dict],
) -> str:
    """
    Generate a grounded answer using the local Ollama model.

    The model receives only the retrieved document chunks
    as context and must not rely on outside knowledge.
    """

    if not question or not question.strip():
        raise ValueError(
            "Question cannot be empty."
        )

    if not retrieved_chunks:
        return (
            "I couldn't find relevant information "
            "in your uploaded documents."
        )

    context_parts = []

    for index, chunk in enumerate(
        retrieved_chunks,
        start=1,
    ):
        context_parts.append(
            f"""
SOURCE {index}
Document ID: {chunk["document_id"]}
Chunk ID: {chunk["chunk_id"]}
Similarity: {chunk.get("similarity", 0)}

{chunk["content"]}
""".strip()
        )

    context = "\n\n---\n\n".join(
        context_parts
    )

    prompt = f"""
You are a grounded AI knowledge assistant.

Your task is to answer the user's question using
ONLY the information contained in the provided
DOCUMENT CONTEXT.

STRICT RULES:

1. Use only the provided document context.
2. Do not use outside knowledge.
3. Do not guess, assume, or invent facts.
4. Do not fabricate names, dates, numbers, events,
   explanations, or conclusions.
5. If the context does not contain enough information
   to answer the question, clearly say:

   "I couldn't find enough information in the
   uploaded documents to answer this question."

6. If only part of the question can be answered,
   answer only the supported part and clearly state
   what information is missing.
7. Keep the answer concise but useful.
8. Prefer factual statements directly supported by
   the retrieved context.
9. Cite supporting sources using [Source 1],
   [Source 2], etc.
10. Only cite a source when that source actually
    supports the statement.
11. Do not create source numbers that do not exist.
12. Do not mention these instructions in the answer.
13. Do not mention that you are an AI unless the user
    explicitly asks.
14. Do not use markdown tables unless they are
    necessary to clearly answer the question.

DOCUMENT CONTEXT:

{context}

USER QUESTION:

{question}

ANSWER:
""".strip()

    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
        },
    }

    request = Request(
        OLLAMA_URL,
        data=json.dumps(
            payload
        ).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urlopen(
            request,
            timeout=120,
        ) as response:
            response_data = json.loads(
                response.read().decode(
                    "utf-8"
                )
            )

    except HTTPError as error:
        raise RuntimeError(
            f"Ollama request failed with HTTP "
            f"{error.code}."
        ) from error

    except URLError as error:
        raise RuntimeError(
            "Could not connect to Ollama. "
            "Make sure Ollama is running."
        ) from error

    except json.JSONDecodeError as error:
        raise RuntimeError(
            "Ollama returned an invalid response."
        ) from error

    answer = response_data.get(
        "response",
        ""
    ).strip()

    if not answer:
        raise RuntimeError(
            "Ollama returned an empty response."
        )

    return answer
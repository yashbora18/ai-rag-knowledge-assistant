import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


# ---------------------------------------------------------
# Gemini configuration
# ---------------------------------------------------------

GEMINI_API_URL = (
    "https://generativelanguage.googleapis.com/"
    "v1beta/models/gemini-2.5-flash:generateContent"
)

MODEL_NAME = "gemini-2.5-flash"


# ---------------------------------------------------------
# Generate grounded RAG answer
# ---------------------------------------------------------

def generate_rag_answer(
    question: str,
    retrieved_chunks: list[dict],
) -> str:
    """
    Generate a grounded answer using Google Gemini.

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

    api_key = os.getenv(
        "GEMINI_API_KEY",
        "",
    ).strip()

    if not api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured on the backend."
        )

    # -----------------------------------------------------
    # Build document context
    # -----------------------------------------------------

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
Chunk Index: {chunk.get("chunk_index", 0)}
Similarity: {chunk.get("similarity", 0)}

{chunk["content"]}
""".strip()
        )

    context = "\n\n---\n\n".join(
        context_parts
    )

    # -----------------------------------------------------
    # Grounded RAG prompt
    # -----------------------------------------------------

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

    # -----------------------------------------------------
    # Gemini request
    # -----------------------------------------------------

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {
                        "text": prompt
                    }
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.1,
            "maxOutputTokens": 2048,
        },
    }

    request = Request(
        GEMINI_API_URL,
        data=json.dumps(
            payload
        ).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "x-goog-api-key": api_key,
        },
        method="POST",
    )

    # -----------------------------------------------------
    # Call Gemini
    # -----------------------------------------------------

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

        try:
            error_body = error.read().decode(
                "utf-8",
                errors="replace",
            )
        except Exception:
            error_body = ""

        raise RuntimeError(
            "Gemini request failed with HTTP "
            f"{error.code}: {error_body[:1000]}"
        ) from error

    except URLError as error:

        raise RuntimeError(
            "Could not connect to the Gemini API. "
            "Please check the backend network connection."
        ) from error

    except TimeoutError as error:

        raise RuntimeError(
            "Gemini API request timed out."
        ) from error

    except json.JSONDecodeError as error:

        raise RuntimeError(
            "Gemini returned an invalid response."
        ) from error

    # -----------------------------------------------------
    # Extract Gemini response
    # -----------------------------------------------------

    candidates = response_data.get(
        "candidates",
        [],
    )

    if not candidates:
        raise RuntimeError(
            "Gemini returned no response candidates."
        )

    candidate = candidates[0]

    content = candidate.get(
        "content",
        {},
    )

    parts = content.get(
        "parts",
        [],
    )

    answer_parts = []

    for part in parts:

        text = part.get(
            "text",
            "",
        )

        if text:
            answer_parts.append(
                text
            )

    answer = "\n".join(
        answer_parts
    ).strip()

    if not answer:
        raise RuntimeError(
            "Gemini returned an empty response."
        )

    return answer
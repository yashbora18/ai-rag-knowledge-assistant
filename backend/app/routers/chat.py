import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.models.conversation import Conversation
from app.models.conversation_message import ConversationMessage
from app.models.ai_usage import AIUsage
from app.models.rag_request_log import RAGRequestLog
from app.models.notification import Notification
from app.services.vector_search_service import (
    search_similar_chunks,
)
from app.services.generation_service import (
    generate_rag_answer,
    MODEL_NAME,
)
router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)
class ChatRequest(BaseModel):
    question: str = Field(
        ...,
        min_length=2,
        max_length=1000,
    )
    top_k: int = Field(
        default=5,
        ge=1,
        le=10,
    )
    conversation_id: int | None = Field(
        default=None,
        ge=1,
    )
    document_ids: list[int] | None = Field(
        default=None,
        description=(
            "Optional list of document IDs to restrict "
            "RAG retrieval to."
        ),
    )
def build_conversation_context(
    messages: list[ConversationMessage],
    max_messages: int = 6,
) -> str:
    """
    Build a compact conversation history for query
    understanding.
    Only recent user/assistant messages are included.
    """
    if not messages:
        return ""
    recent_messages = messages[-max_messages:]
    context_parts = []
    for message in recent_messages:
        role = (
            "User"
            if message.role == "user"
            else "Assistant"
        )
        content = (
            message.content or ""
        ).strip()
        if not content:
            continue
        context_parts.append(
            f"{role}: {content}"
        )
    return "\n".join(context_parts)
def build_retrieval_query(
    question: str,
    conversation_context: str,
) -> str:
    """
    Create a retrieval query that incorporates recent
    conversation context.
    This is deliberately deterministic and does not call
    another LLM. The original user question remains the
    primary query.
    """
    question = question.strip()
    if not conversation_context:
        return question
    return (
        "Recent conversation:\n"
        f"{conversation_context}\n\n"
        "Current user question:\n"
        f"{question}"
    )
def calculate_similarity_metrics(
    retrieved_chunks: list[dict],
) -> tuple[float | None, float | None]:
    """
    Calculate aggregate retrieval-quality metrics.
    Returns:
        average_similarity, max_similarity
    """
    similarity_scores = [
        float(chunk["similarity"])
        for chunk in retrieved_chunks
        if chunk.get("similarity") is not None
    ]
    if not similarity_scores:
        return None, None
    average_similarity = round(
        sum(similarity_scores)
        / len(similarity_scores),
        4,
    )
    max_similarity = round(
        max(similarity_scores),
        4,
    )
    return average_similarity, max_similarity
def increment_ai_usage(
    db: Session,
    user_id: int,
) -> AIUsage:
    """
    Increment the authenticated user's successful AI
    query usage.
    If an AIUsage record does not exist yet, create one
    with the default quota.
    """
    usage = db.scalar(
        select(AIUsage).where(
            AIUsage.user_id == user_id
        )
    )
    if usage is None:
        usage = AIUsage(
            user_id=user_id,
            query_count=1,
            query_limit=1000,
        )
        db.add(usage)
    else:
        usage.query_count += 1
    return usage
def check_ai_usage_limit(
    db: Session,
    user_id: int,
) -> AIUsage:
    """
    Check whether the authenticated user can make
    another AI request.
    If no usage record exists, create one with the
    default quota and zero usage.
    """
    usage = db.scalar(
        select(AIUsage).where(
            AIUsage.user_id == user_id
        )
    )
    if usage is None:
        usage = AIUsage(
            user_id=user_id,
            query_count=0,
            query_limit=1000,
        )
        db.add(usage)
        db.flush()
    if usage.query_count >= usage.query_limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=(
                "AI query limit reached. "
                "Please try again after your quota resets."
            ),
        )
    return usage
@router.post("/")
def chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    """
    Run the complete RAG pipeline and persist the
    conversation messages, source citations,
    observability metrics, and AI usage.
    Conversation history is used only to improve retrieval
    for follow-up questions. The final answer remains
    grounded in retrieved document chunks.
    If document_ids are provided, retrieval is restricted
    to those documents belonging to the authenticated user.
    """
    request_start = time.perf_counter()
    conversation = None
    retrieval_time_ms = None
    generation_time_ms = None
    retrieved_chunks = []
    answer = None
    try:
        # -------------------------------------------------
        # 0. Check AI usage quota
        # -------------------------------------------------
        check_ai_usage_limit(
            db=db,
            user_id=current_user.id
        )
        # -------------------------------------------------
        # 1. Get or create conversation
        # -------------------------------------------------
        conversation = None
        if request.conversation_id is not None:
            conversation = db.scalar(
                select(Conversation).where(
                    Conversation.id
                    == request.conversation_id,
                    Conversation.user_id
                    == current_user.id,
                )
            )
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found.",
                )
        else:
            title = request.question.strip()
            if len(title) > 60:
                title = title[:57] + "..."
            conversation = Conversation(
                user_id=current_user.id,
                title=title,
            )
            db.add(conversation)
            db.flush()
        # -------------------------------------------------
        # 2. Load recent conversation history
        # -------------------------------------------------
        previous_messages = db.scalars(
            select(ConversationMessage)
            .where(
                ConversationMessage.conversation_id
                == conversation.id
            )
            .order_by(
                ConversationMessage.created_at.asc()
            )
        ).all()
        conversation_context = (
            build_conversation_context(
                previous_messages,
                max_messages=6,
            )
        )
        # -------------------------------------------------
        # 3. Build retrieval query
        # -------------------------------------------------
        retrieval_query = build_retrieval_query(
            question=request.question,
            conversation_context=conversation_context,
        )
        # -------------------------------------------------
        # 4. Store current user message
        # -------------------------------------------------
        user_message = ConversationMessage(
            conversation_id=conversation.id,
            role="user",
            content=request.question.strip(),
        )
        db.add(user_message)
        db.flush()
        # -------------------------------------------------
        # 5. Retrieve relevant document chunks
        # -------------------------------------------------
        retrieval_start = time.perf_counter()
        retrieved_chunks = search_similar_chunks(
            db=db,
            query=retrieval_query,
            user_id=current_user.id,
            top_k=request.top_k,
            document_ids=request.document_ids,
        )
        retrieval_time_ms = round(
            (
                time.perf_counter()
                - retrieval_start
            )
            * 1000,
            2,
        )
        # -------------------------------------------------
        # 6. Calculate retrieval-quality metrics
        # -------------------------------------------------
        (
            average_similarity,
            max_similarity,
        ) = calculate_similarity_metrics(
            retrieved_chunks
        )
        # -------------------------------------------------
        # 7. Generate grounded answer
        # -------------------------------------------------
        generation_start = time.perf_counter()
        answer = generate_rag_answer(
            question=request.question,
            retrieved_chunks=retrieved_chunks,
        )
        generation_time_ms = round(
            (
                time.perf_counter()
                - generation_start
            )
            * 1000,
            2,
        )
        # -------------------------------------------------
        # 8. Build persistent source data
        # -------------------------------------------------
        sources = [
            {
                "chunk_id": chunk["chunk_id"],
                "document_id": chunk["document_id"],
                "chunk_index": chunk["chunk_index"],
                "similarity": chunk["similarity"],
                "content": chunk["content"],
            }
            for chunk in retrieved_chunks
        ]
        # -------------------------------------------------
        # 9. Store assistant message with sources
        # -------------------------------------------------
        assistant_message = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=answer,
            sources=sources,
        )
        db.add(assistant_message)
        # -------------------------------------------------
        # 10. Update conversation timestamp
        # -------------------------------------------------
        conversation.updated_at = datetime.now(
            timezone.utc
        )
        # -------------------------------------------------
        # 11. Calculate total request time
        # -------------------------------------------------
        total_time_ms = round(
            (
                time.perf_counter()
                - request_start
            )
            * 1000,
            2,
        )
        # -------------------------------------------------
        # 12. Create successful RAG observability log
        # -------------------------------------------------
        usage_log = RAGRequestLog(
            user_id=current_user.id,
            conversation_id=conversation.id,
            question=request.question.strip(),
            answer=answer,
            model_name=MODEL_NAME,
            retrieved_chunks=len(
                retrieved_chunks
            ),
            document_ids=(
                request.document_ids
                if request.document_ids is not None
                else list(
                    {
                        chunk["document_id"]
                        for chunk in retrieved_chunks
                    }
                )
            ),
            similarity_scores=[
                chunk["similarity"]
                for chunk in retrieved_chunks
            ],
            average_similarity=average_similarity,
            max_similarity=max_similarity,
            retrieval_time_ms=retrieval_time_ms,
            generation_time_ms=generation_time_ms,
            total_time_ms=total_time_ms,
            status="success",
            error_message=None,
        )
        db.add(usage_log)
        # -------------------------------------------------
        # 12a. Create real success notification
        # -------------------------------------------------
        notification = Notification(
            user_id=current_user.id,
            type="ai",
            title="AI response generated",
            message=request.question.strip(),
            is_read=False,
        )
        db.add(notification)
        # -------------------------------------------------
        # 13. Increment successful AI usage
        # -------------------------------------------------
        increment_ai_usage(
            db=db,
            user_id=current_user.id,
        )
        # -------------------------------------------------
        # 14. Commit everything
        # -------------------------------------------------
        db.commit()
        # -------------------------------------------------
        # 15. Return response
        # -------------------------------------------------
        return {
            "conversation_id": conversation.id,
            "question": request.question,
            "answer": answer,
            "sources": sources,
            "source_count": len(sources),
            "document_ids": request.document_ids,
        }
    except HTTPException:
        db.rollback()
        raise
    except ValueError as error:
        db.rollback()
        _log_failed_request(
            db=db,
            current_user=current_user,
            conversation=conversation,
            question=request.question,
            retrieved_chunks=retrieved_chunks,
            retrieval_time_ms=retrieval_time_ms,
            generation_time_ms=generation_time_ms,
            error_message=str(error),
            request_start=request_start,
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(error),
        ) from error
    except RuntimeError as error:
        db.rollback()
        _log_failed_request(
            db=db,
            current_user=current_user,
            conversation=conversation,
            question=request.question,
            retrieved_chunks=retrieved_chunks,
            retrieval_time_ms=retrieval_time_ms,
            generation_time_ms=generation_time_ms,
            error_message=str(error),
            request_start=request_start,
        )
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(error),
        ) from error
    except Exception as error:
        db.rollback()
        _log_failed_request(
            db=db,
            current_user=current_user,
            conversation=conversation,
            question=request.question,
            retrieved_chunks=retrieved_chunks,
            retrieval_time_ms=retrieval_time_ms,
            generation_time_ms=generation_time_ms,
            error_message=str(error),
            request_start=request_start,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Chat request failed.",
        ) from error
def _log_failed_request(
    db: Session,
    current_user: User,
    conversation: Conversation | None,
    question: str,
    retrieved_chunks: list,
    retrieval_time_ms: float | None,
    generation_time_ms: float | None,
    error_message: str,
    request_start: float,
) -> None:
    """
    Persist a failed RAG request for observability.
    Failed requests do NOT increment AI usage.
    Logging failure must never hide the original
    application error.
    """
    try:
        total_time_ms = round(
            (
                time.perf_counter()
                - request_start
            )
            * 1000,
            2,
        )
        (
            average_similarity,
            max_similarity,
        ) = calculate_similarity_metrics(
            retrieved_chunks
        )
        failed_log = RAGRequestLog(
            user_id=current_user.id,
            conversation_id=(
                conversation.id
                if conversation
                else None
            ),
            question=question.strip(),
            answer=None,
            model_name=MODEL_NAME,
            retrieved_chunks=len(
                retrieved_chunks
            ),
            document_ids=list(
                {
                    chunk["document_id"]
                    for chunk in retrieved_chunks
                    if chunk.get("document_id")
                    is not None
                }
            ),
            similarity_scores=[
                chunk["similarity"]
                for chunk in retrieved_chunks
                if chunk.get("similarity")
                is not None
            ],
            average_similarity=average_similarity,
            max_similarity=max_similarity,
            retrieval_time_ms=retrieval_time_ms,
            generation_time_ms=generation_time_ms,
            total_time_ms=total_time_ms,
            status="failed",
            error_message=error_message[:5000],
        )
        db.add(failed_log)
        # -------------------------------------------------
        # Create real failure notification
        # -------------------------------------------------
        notification = Notification(
            user_id=current_user.id,
            type="error",
            title="AI response failed",
            message=error_message[:500],
            is_read=False,
        )
        db.add(notification)
        db.commit()
    except Exception:
        db.rollback()

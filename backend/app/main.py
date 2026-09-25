from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.database import Base, engine

from app.models.user import User
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.knowledge_chunk import KnowledgeChunk
from app.models.conversation import Conversation
from app.models.conversation_message import ConversationMessage
from app.models.ai_usage import AIUsage
from app.models.rag_request_log import RAGRequestLog
from app.models.notification import Notification
from app.models.password_reset_token import PasswordResetToken

from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.documents import router as documents_router
from app.routers.dashboard import router as dashboard_router
from app.routers.search import router as search_router
from app.routers.chat import router as chat_router
from app.routers.conversations import router as conversations_router
from app.routers.notifications import router as notifications_router


# ---------------------------------------------------------
# Database initialization
# ---------------------------------------------------------

if settings.AUTO_CREATE_TABLES:
    Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------
# FastAPI application
# ---------------------------------------------------------

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Backend API for the AI-powered "
        "RAG Knowledge Assistant."
    ),
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "OPTIONS",
    ],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "Origin",
        "X-Requested-With",
    ],
)


# ---------------------------------------------------------
# Routers
# ---------------------------------------------------------

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(documents_router)
app.include_router(dashboard_router)
app.include_router(search_router)
app.include_router(chat_router)
app.include_router(conversations_router)
app.include_router(notifications_router)


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "message": settings.APP_NAME,
        "status": "success",
        "version": settings.APP_VERSION,
    }


# ---------------------------------------------------------
# Health
# ---------------------------------------------------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }
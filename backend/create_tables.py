from app.db.database import Base, engine

# Import every model so SQLAlchemy registers all tables.
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


def main():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")


if __name__ == "__main__":
    main()
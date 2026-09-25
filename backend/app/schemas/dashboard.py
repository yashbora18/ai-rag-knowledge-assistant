from pydantic import BaseModel


class DashboardStats(BaseModel):
    documents: int
    knowledge_chunks: int
    conversations: int
    ai_queries: int
    ai_query_limit: int


class RAGAnalytics(BaseModel):
    total_requests: int
    successful_requests: int
    failed_requests: int
    success_rate: float

    average_retrieval_time_ms: float
    average_generation_time_ms: float
    average_total_time_ms: float
    average_retrieved_chunks: float

    average_similarity: float
    average_max_similarity: float

    low_quality_requests: int
    retrieval_quality: str


class RecentDocument(BaseModel):
    id: int
    filename: str
    file_size: int
    status: str
    created_at: str


class RecentRAGRequest(BaseModel):
    id: int
    conversation_id: int | None
    question: str
    model_name: str
    retrieved_chunks: int

    retrieval_time_ms: float | None
    generation_time_ms: float | None
    total_time_ms: float | None

    average_similarity: float | None
    max_similarity: float | None

    status: str
    created_at: str


class DashboardResponse(BaseModel):
    stats: DashboardStats
    rag_analytics: RAGAnalytics
    recent_documents: list[RecentDocument]
    recent_rag_requests: list[RecentRAGRequest]
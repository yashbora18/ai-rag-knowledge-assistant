import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  MessageSquareText,
  Plus,
  Sparkles,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/common/Button/Button";
import Navbar from "../../components/layout/Navbar/Navbar";
import Sidebar from "../../components/layout/Sidebar/Sidebar";

import { getDashboardData } from "../../services/dashboardService";
import { useToast } from "../../hooks/useToast";

import "./Dashboard.css";


function formatFileSize(bytes) {
  if (!bytes) {
    return "0 KB";
  }

  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}


function formatDate(dateString) {
  if (!dateString) {
    return "Unknown date";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


function formatDateTime(dateString) {
  if (!dateString) {
    return "Unknown time";
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}


function formatMilliseconds(value) {
  if (value === null || value === undefined) {
    return "0 ms";
  }

  const milliseconds = Number(value);

  if (!Number.isFinite(milliseconds)) {
    return "0 ms";
  }

  if (milliseconds >= 1000) {
    return `${(milliseconds / 1000).toFixed(2)} s`;
  }

  return `${Math.round(milliseconds)} ms`;
}


function formatSimilarity(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  const similarity = Number(value);

  if (!Number.isFinite(similarity)) {
    return "—";
  }

  return `${(similarity * 100).toFixed(1)}%`;
}


function formatRetrievalQuality(value) {
  if (!value) {
    return "No data";
  }

  const labels = {
    no_data: "No data",
    low: "Low",
    moderate: "Moderate",
    good: "Good",
  };

  return labels[value] || value;
}


function Dashboard() {
  const navigate = useNavigate();
  const { error: showError } = useToast();

  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await getDashboardData();

        if (isMounted) {
          setDashboard(data);
        }
      } catch (error) {
        if (isMounted) {
          showError(
            error?.response?.data?.detail ||
              "Unable to load dashboard data."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [showError]);

  const stats = dashboard?.stats;

  const recentDocuments =
    dashboard?.recent_documents || [];

  const ragAnalytics =
    dashboard?.rag_analytics || {};

  const recentRagRequests =
    dashboard?.recent_rag_requests || [];

  const aiUsagePercentage = useMemo(() => {
    if (!stats?.ai_query_limit) {
      return 0;
    }

    return Math.min(
      100,
      Math.round(
        (stats.ai_queries / stats.ai_query_limit) * 100
      )
    );
  }, [stats]);

  const ragSuccessRate =
    Number(ragAnalytics.success_rate || 0);

  const retrievalQuality =
    ragAnalytics.retrieval_quality || "no_data";

  return (
    <div className="dashboard-page">
      <Navbar />

      <div className="dashboard-page__app">
        <Sidebar />

        <main className="dashboard-page__main">
          {/* Header */}
          <header className="dashboard-page__header">
            <div>
              <div className="dashboard-page__eyebrow">
                <Sparkles size={14} />
                AI Knowledge Workspace
              </div>

              <h1 className="dashboard-page__title">
                Welcome back
              </h1>

              <p className="dashboard-page__subtitle">
                Manage your knowledge base, explore documents,
                and ask AI questions grounded in your content.
              </p>
            </div>

            <div className="dashboard-page__header-action">
              <Button
                onClick={() => navigate("/documents")}
              >
                <Plus size={17} />
                Add document
              </Button>
            </div>
          </header>

          {/* Statistics */}
          <section
            className="dashboard-page__stats"
            aria-label="Workspace statistics"
          >
            {/* Documents */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  Documents
                </span>

                <span className="dashboard-page__stat-icon">
                  <FileText size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : stats?.documents ?? 0}
              </div>

              <div className="dashboard-page__stat-change">
                <FileText size={13} />
                Total knowledge sources
              </div>
            </div>

            {/* Knowledge chunks */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  Knowledge chunks
                </span>

                <span className="dashboard-page__stat-icon">
                  <FolderOpen size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : (
                      stats?.knowledge_chunks ?? 0
                    ).toLocaleString()}
              </div>

              <div className="dashboard-page__stat-change">
                <FolderOpen size={13} />
                Indexed content chunks
              </div>
            </div>

            {/* Conversations */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  AI conversations
                </span>

                <span className="dashboard-page__stat-icon">
                  <MessageSquareText size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : (
                      stats?.conversations ?? 0
                    ).toLocaleString()}
              </div>

              <div className="dashboard-page__stat-change">
                <MessageSquareText size={13} />
                Total conversations
              </div>
            </div>

            {/* AI usage */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  AI usage
                </span>

                <span className="dashboard-page__stat-icon">
                  <Bot size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : `${aiUsagePercentage}%`}
              </div>

              <div className="dashboard-page__stat-change">
                {isLoading
                  ? "Loading usage"
                  : `${(
                      stats?.ai_queries ?? 0
                    ).toLocaleString()} of ${(
                      stats?.ai_query_limit ?? 0
                    ).toLocaleString()} queries`}
              </div>
            </div>
          </section>

          {/* RAG Observability */}
          <section
            className="dashboard-page__stats"
            aria-label="RAG observability statistics"
          >
            {/* Total RAG requests */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  RAG requests
                </span>

                <span className="dashboard-page__stat-icon">
                  <Activity size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : (
                      ragAnalytics.total_requests ?? 0
                    ).toLocaleString()}
              </div>

              <div className="dashboard-page__stat-change">
                <Activity size={13} />
                Total retrieval requests
              </div>
            </div>

            {/* Success rate */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  Success rate
                </span>

                <span className="dashboard-page__stat-icon">
                  <CheckCircle2 size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : `${ragSuccessRate.toFixed(1)}%`}
              </div>

              <div className="dashboard-page__stat-change">
                <CheckCircle2 size={13} />
                {isLoading
                  ? "Loading request health"
                  : `${(
                      ragAnalytics.successful_requests ?? 0
                    ).toLocaleString()} successful`}
              </div>
            </div>

            {/* Average response time */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  Avg. response
                </span>

                <span className="dashboard-page__stat-icon">
                  <Clock3 size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : formatMilliseconds(
                      ragAnalytics.average_total_time_ms
                    )}
              </div>

              <div className="dashboard-page__stat-change">
                <Clock3 size={13} />
                End-to-end RAG latency
              </div>
            </div>

            {/* Average retrieved chunks */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  Avg. retrieval
                </span>

                <span className="dashboard-page__stat-icon">
                  <FolderOpen size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : Number(
                      ragAnalytics.average_retrieved_chunks ||
                        0
                    ).toFixed(1)}
              </div>

              <div className="dashboard-page__stat-change">
                <FolderOpen size={13} />
                Chunks retrieved per request
              </div>
            </div>

            {/* Average similarity */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  Avg. similarity
                </span>

                <span className="dashboard-page__stat-icon">
                  <Sparkles size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : formatSimilarity(
                      ragAnalytics.average_similarity
                    )}
              </div>

              <div className="dashboard-page__stat-change">
                <Sparkles size={13} />
                Average retrieval relevance
              </div>
            </div>

            {/* Best similarity */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  Best similarity
                </span>

                <span className="dashboard-page__stat-icon">
                  <CheckCircle2 size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : formatSimilarity(
                      ragAnalytics.average_max_similarity
                    )}
              </div>

              <div className="dashboard-page__stat-change">
                <CheckCircle2 size={13} />
                Average best-match relevance
              </div>
            </div>

            {/* Low-quality requests */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  Low-quality requests
                </span>

                <span className="dashboard-page__stat-icon">
                  <AlertCircle size={18} />
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : (
                      ragAnalytics.low_quality_requests ??
                      0
                    ).toLocaleString()}
              </div>

              <div className="dashboard-page__stat-change">
                <AlertCircle size={13} />
                Requests below 30% average similarity
              </div>
            </div>

            {/* Retrieval quality */}
            <div className="dashboard-page__stat-card">
              <div className="dashboard-page__stat-top">
                <span className="dashboard-page__stat-label">
                  Retrieval quality
                </span>

                <span className="dashboard-page__stat-icon">
                  {retrievalQuality === "low" ? (
                    <AlertCircle size={18} />
                  ) : (
                    <CheckCircle2 size={18} />
                  )}
                </span>
              </div>

              <div className="dashboard-page__stat-value">
                {isLoading
                  ? "—"
                  : formatRetrievalQuality(
                      retrievalQuality
                    )}
              </div>

              <div className="dashboard-page__stat-change">
                <Sparkles size={13} />
                Based on average similarity
              </div>
            </div>
          </section>

          {/* Main dashboard grid */}
          <section className="dashboard-page__grid">
            {/* Recent Documents */}
            <div className="dashboard-page__card dashboard-page__card--large">
              <div className="dashboard-page__card-header">
                <div>
                  <h2 className="dashboard-page__card-title">
                    Recent documents
                  </h2>

                  <p className="dashboard-page__card-description">
                    Your latest knowledge sources
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => navigate("/documents")}
                >
                  View all
                  <ArrowRight size={15} />
                </Button>
              </div>

              <div className="dashboard-page__activity">
                {isLoading ? (
                  <div className="dashboard-page__activity-item">
                    <div className="dashboard-page__activity-icon">
                      <FileText size={17} />
                    </div>

                    <div className="dashboard-page__activity-content">
                      <div className="dashboard-page__activity-name">
                        Loading documents...
                      </div>

                      <div className="dashboard-page__activity-meta">
                        Fetching your knowledge sources
                      </div>
                    </div>
                  </div>
                ) : recentDocuments.length === 0 ? (
                  <div className="dashboard-page__activity-item">
                    <div className="dashboard-page__activity-icon">
                      <FolderOpen size={17} />
                    </div>

                    <div className="dashboard-page__activity-content">
                      <div className="dashboard-page__activity-name">
                        No documents yet
                      </div>

                      <div className="dashboard-page__activity-meta">
                        Add your first knowledge source to get started.
                      </div>
                    </div>
                  </div>
                ) : (
                  recentDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="dashboard-page__activity-item"
                    >
                      <div className="dashboard-page__activity-icon">
                        <FileText size={17} />
                      </div>

                      <div className="dashboard-page__activity-content">
                        <div className="dashboard-page__activity-name">
                          {document.filename}
                        </div>

                        <div className="dashboard-page__activity-meta">
                          {formatFileSize(document.file_size)}
                          {" • "}
                          Added {formatDate(document.created_at)}
                        </div>
                      </div>

                      <span className="dashboard-page__activity-status">
                        {document.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent RAG Requests */}
            <div className="dashboard-page__card dashboard-page__card--large">
              <div className="dashboard-page__card-header">
                <div>
                  <h2 className="dashboard-page__card-title">
                    Recent RAG requests
                  </h2>

                  <p className="dashboard-page__card-description">
                    Live retrieval and generation activity
                  </p>
                </div>

                <span className="dashboard-page__stat-icon">
                  <Activity size={18} />
                </span>
              </div>

              <div className="dashboard-page__activity">
                {isLoading ? (
                  <div className="dashboard-page__activity-item">
                    <div className="dashboard-page__activity-icon">
                      <Activity size={17} />
                    </div>

                    <div className="dashboard-page__activity-content">
                      <div className="dashboard-page__activity-name">
                        Loading RAG activity...
                      </div>

                      <div className="dashboard-page__activity-meta">
                        Fetching observability data
                      </div>
                    </div>
                  </div>
                ) : recentRagRequests.length === 0 ? (
                  <div className="dashboard-page__activity-item">
                    <div className="dashboard-page__activity-icon">
                      <MessageSquareText size={17} />
                    </div>

                    <div className="dashboard-page__activity-content">
                      <div className="dashboard-page__activity-name">
                        No RAG requests yet
                      </div>

                      <div className="dashboard-page__activity-meta">
                        Ask a question in AI Chat to generate activity.
                      </div>
                    </div>
                  </div>
                ) : (
                  recentRagRequests.map((request) => (
                    <div
                      key={request.id}
                      className="dashboard-page__activity-item"
                    >
                      <div className="dashboard-page__activity-icon">
                        {request.status === "success" ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          <AlertCircle size={17} />
                        )}
                      </div>

                      <div className="dashboard-page__activity-content">
                        <div className="dashboard-page__activity-name">
                          {request.question}
                        </div>

                        <div className="dashboard-page__activity-meta">
                          {request.model_name}
                          {" • "}
                          {request.retrieved_chunks}{" "}
                          {request.retrieved_chunks === 1
                            ? "chunk"
                            : "chunks"}
                          {" • "}
                          Avg.{" "}
                          {formatSimilarity(
                            request.average_similarity
                          )}
                          {" • "}
                          Best{" "}
                          {formatSimilarity(
                            request.max_similarity
                          )}
                          {" • "}
                          {formatMilliseconds(
                            request.total_time_ms
                          )}
                          {" • "}
                          {formatDateTime(
                            request.created_at
                          )}
                        </div>
                      </div>

                      <span className="dashboard-page__activity-status">
                        {request.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-page__card">
              <div className="dashboard-page__card-header">
                <div>
                  <h2 className="dashboard-page__card-title">
                    Quick actions
                  </h2>

                  <p className="dashboard-page__card-description">
                    Get started with your workspace
                  </p>
                </div>
              </div>

              <div className="dashboard-page__quick-actions">
                <button
                  type="button"
                  className="dashboard-page__quick-action"
                  onClick={() => navigate("/documents")}
                >
                  <span className="dashboard-page__quick-action-icon">
                    <Upload size={17} />
                  </span>

                  <span className="dashboard-page__quick-action-content">
                    <span className="dashboard-page__quick-action-title">
                      Upload document
                    </span>

                    <span className="dashboard-page__quick-action-description">
                      Add a new knowledge source
                    </span>
                  </span>

                  <ArrowRight
                    size={16}
                    className="dashboard-page__quick-action-arrow"
                  />
                </button>

                <button
                  type="button"
                  className="dashboard-page__quick-action"
                  onClick={() => navigate("/chat")}
                >
                  <span className="dashboard-page__quick-action-icon">
                    <MessageSquareText size={17} />
                  </span>

                  <span className="dashboard-page__quick-action-content">
                    <span className="dashboard-page__quick-action-title">
                      Start a conversation
                    </span>

                    <span className="dashboard-page__quick-action-description">
                      Ask questions about your documents
                    </span>
                  </span>

                  <ArrowRight
                    size={16}
                    className="dashboard-page__quick-action-arrow"
                  />
                </button>

                <button
                  type="button"
                  className="dashboard-page__quick-action"
                  onClick={() => navigate("/documents")}
                >
                  <span className="dashboard-page__quick-action-icon">
                    <FolderOpen size={17} />
                  </span>

                  <span className="dashboard-page__quick-action-content">
                    <span className="dashboard-page__quick-action-title">
                      Browse knowledge
                    </span>

                    <span className="dashboard-page__quick-action-description">
                      Explore your indexed content
                    </span>
                  </span>

                  <ArrowRight
                    size={16}
                    className="dashboard-page__quick-action-arrow"
                  />
                </button>
              </div>
            </div>

            {/* AI Usage */}
            <div className="dashboard-page__card">
              <div className="dashboard-page__card-header">
                <div>
                  <h2 className="dashboard-page__card-title">
                    AI usage
                  </h2>

                  <p className="dashboard-page__card-description">
                    Current workspace usage
                  </p>
                </div>
              </div>

              <div className="dashboard-page__usage">
                <div className="dashboard-page__usage-row">
                  <span className="dashboard-page__usage-label">
                    AI queries
                  </span>

                  <span className="dashboard-page__usage-value">
                    {isLoading
                      ? "—"
                      : `${(
                          stats?.ai_queries ?? 0
                        ).toLocaleString()} / ${(
                          stats?.ai_query_limit ?? 0
                        ).toLocaleString()}`}
                  </span>
                </div>

                <div className="dashboard-page__progress">
                  <div
                    className="dashboard-page__progress-bar"
                    style={{
                      width: `${aiUsagePercentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* RAG Performance */}
            <div className="dashboard-page__card">
              <div className="dashboard-page__card-header">
                <div>
                  <h2 className="dashboard-page__card-title">
                    RAG performance
                  </h2>

                  <p className="dashboard-page__card-description">
                    Retrieval, relevance and generation metrics
                  </p>
                </div>

                <span className="dashboard-page__stat-icon">
                  <Clock3 size={18} />
                </span>
              </div>

              <div className="dashboard-page__usage">
                <div className="dashboard-page__usage-row">
                  <span className="dashboard-page__usage-label">
                    Retrieval
                  </span>

                  <span className="dashboard-page__usage-value">
                    {isLoading
                      ? "—"
                      : formatMilliseconds(
                          ragAnalytics.average_retrieval_time_ms
                        )}
                  </span>
                </div>

                <div className="dashboard-page__usage-row">
                  <span className="dashboard-page__usage-label">
                    Generation
                  </span>

                  <span className="dashboard-page__usage-value">
                    {isLoading
                      ? "—"
                      : formatMilliseconds(
                          ragAnalytics.average_generation_time_ms
                        )}
                  </span>
                </div>

                <div className="dashboard-page__usage-row">
                  <span className="dashboard-page__usage-label">
                    Total
                  </span>

                  <span className="dashboard-page__usage-value">
                    {isLoading
                      ? "—"
                      : formatMilliseconds(
                          ragAnalytics.average_total_time_ms
                        )}
                  </span>
                </div>

                <div className="dashboard-page__usage-row">
                  <span className="dashboard-page__usage-label">
                    Avg. similarity
                  </span>

                  <span className="dashboard-page__usage-value">
                    {isLoading
                      ? "—"
                      : formatSimilarity(
                          ragAnalytics.average_similarity
                        )}
                  </span>
                </div>

                <div className="dashboard-page__usage-row">
                  <span className="dashboard-page__usage-label">
                    Best similarity
                  </span>

                  <span className="dashboard-page__usage-value">
                    {isLoading
                      ? "—"
                      : formatSimilarity(
                          ragAnalytics.average_max_similarity
                        )}
                  </span>
                </div>

                <div className="dashboard-page__usage-row">
                  <span className="dashboard-page__usage-label">
                    Low-quality requests
                  </span>

                  <span className="dashboard-page__usage-value">
                    {isLoading
                      ? "—"
                      : (
                          ragAnalytics.low_quality_requests ??
                          0
                        ).toLocaleString()}
                  </span>
                </div>

                <div className="dashboard-page__usage-row">
                  <span className="dashboard-page__usage-label">
                    Retrieval quality
                  </span>

                  <span className="dashboard-page__usage-value">
                    {isLoading
                      ? "—"
                      : formatRetrievalQuality(
                          retrievalQuality
                        )}
                  </span>
                </div>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="dashboard-page__card">
              <div className="dashboard-page__welcome">
                <div className="dashboard-page__welcome-icon">
                  <Bot size={24} />
                </div>

                <h2 className="dashboard-page__welcome-title">
                  Your AI knowledge assistant
                </h2>

                <p className="dashboard-page__welcome-text">
                  Ask questions about your uploaded documents
                  and get answers based on the information inside
                  your knowledge base.
                </p>

                <Button
                  variant="ghost"
                  size="small"
                  onClick={() => navigate("/chat")}
                >
                  Open AI Chat
                  <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}


export default Dashboard;
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  Hash,
  HardDrive,
  Loader2,
  AlertCircle,
  Database,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { getDocument } from "../../services/documentService";
import { useToast } from "../../context/ToastContext";

import "./DocumentDetails.css";

function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB"];
  const index = Math.floor(
    Math.log(bytes) / Math.log(1024)
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(
    index === 0 ? 0 : 2
  )} ${units[index]}`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "—";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileType(filename) {
  const extension =
    filename?.split(".").pop()?.toLowerCase() || "";

  const types = {
    pdf: "PDF",
    docx: "DOCX",
    txt: "Text",
    md: "Markdown",
  };

  return types[extension] || extension.toUpperCase() || "File";
}

function getStatusLabel(status) {
  const normalizedStatus = String(
    status || ""
  ).toLowerCase();

  if (normalizedStatus === "ready") {
    return "Indexed";
  }

  if (normalizedStatus === "processing") {
    return "Processing";
  }

  if (normalizedStatus === "failed") {
    return "Failed";
  }

  return status || "Unknown";
}

function DocumentDetails() {
  const navigate = useNavigate();
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const { error: showError } = useToast();

  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const highlightedChunkRef = useRef(null);

  const requestedChunkIndex = useMemo(() => {
    const value = searchParams.get("chunk_index");

    if (value === null) {
      return null;
    }

    const parsed = Number.parseInt(value, 10);

    return Number.isNaN(parsed) ? null : parsed;
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadDocument() {
      try {
        setIsLoading(true);
        setLoadError("");

        const data = await getDocument(documentId);

        if (!isMounted) {
          return;
        }

        setDocument(data);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        const message =
          error?.response?.data?.detail ||
          "Unable to load this document.";

        setLoadError(message);
        showError(message);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    if (documentId) {
      loadDocument();
    } else {
      setLoadError("Document ID is missing.");
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [documentId, showError]);

  useEffect(() => {
    if (
      !document ||
      requestedChunkIndex === null ||
      !highlightedChunkRef.current
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      highlightedChunkRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 250);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [document, requestedChunkIndex]);

  const chunks = document?.chunks || [];

  const relevantChunk =
    requestedChunkIndex !== null
      ? chunks.find(
          (chunk) =>
            chunk.chunk_index === requestedChunkIndex
        )
      : null;

  const handleBack = () => {
    navigate("/documents");
  };

  if (isLoading) {
    return (
      <div className="document-details-page">
        <div className="document-details-loading">
          <div className="document-details-loading-icon">
            <Loader2 size={28} className="spin" />
          </div>

          <h2>Loading document</h2>
          <p>
            Fetching document details and indexed content...
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !document) {
    return (
      <div className="document-details-page">
        <div className="document-details-error">
          <div className="document-details-error-icon">
            <AlertCircle size={28} />
          </div>

          <h2>Document unavailable</h2>

          <p>
            {loadError ||
              "The requested document could not be found."}
          </p>

          <button
            type="button"
            className="document-details-back-button"
            onClick={handleBack}
          >
            <ArrowLeft size={17} />
            Back to Documents
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="document-details-page">
      <div className="document-details-container">
        {/* Header */}
        <div className="document-details-header">
          <button
            type="button"
            className="document-details-back"
            onClick={handleBack}
          >
            <ArrowLeft size={17} />
            Back to Documents
          </button>

          <div className="document-details-heading">
            <div className="document-details-file-icon">
              <FileText size={26} />
            </div>

            <div className="document-details-title-wrapper">
              <div className="document-details-title-row">
                <h1>{document.filename}</h1>

                <span className="document-details-type">
                  {getFileType(document.filename)}
                </span>
              </div>

              <p>
                Document #{document.id} ·{" "}
                {getStatusLabel(document.status)}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <section className="document-details-meta-grid">
          <div className="document-details-meta-card">
            <div className="document-details-meta-icon">
              <HardDrive size={18} />
            </div>

            <div>
              <span>File size</span>
              <strong>
                {formatFileSize(document.file_size)}
              </strong>
            </div>
          </div>

          <div className="document-details-meta-card">
            <div className="document-details-meta-icon">
              <Clock3 size={18} />
            </div>

            <div>
              <span>Uploaded</span>
              <strong>
                {formatDate(document.created_at)}
              </strong>
            </div>
          </div>

          <div className="document-details-meta-card">
            <div className="document-details-meta-icon">
              <Database size={18} />
            </div>

            <div>
              <span>Chunks</span>
              <strong>
                {document.chunk_count ?? chunks.length}
              </strong>
            </div>
          </div>

          <div className="document-details-meta-card">
            <div className="document-details-meta-icon">
              {String(document.status).toLowerCase() ===
              "ready" ? (
                <CheckCircle2 size={18} />
              ) : (
                <Clock3 size={18} />
              )}
            </div>

            <div>
              <span>Indexing status</span>

              <strong
                className={`document-status document-status--${String(
                  document.status || "unknown"
                ).toLowerCase()}`}
              >
                {getStatusLabel(document.status)}
              </strong>
            </div>
          </div>
        </section>

        {/* Relevant source */}
        {relevantChunk && (
          <section className="document-details-relevant">
            <div className="document-details-section-heading">
              <div>
                <span className="document-details-eyebrow">
                  Retrieved source
                </span>

                <h2>Relevant source chunk</h2>
              </div>

              <span className="document-details-chunk-badge">
                <Hash size={14} />
                Chunk {relevantChunk.chunk_index + 1}
              </span>
            </div>

            <div className="document-details-relevant-card">
              <div className="document-details-relevant-indicator" />

              <p>{relevantChunk.content}</p>
            </div>
          </section>
        )}

        {/* Document content */}
        <section className="document-details-content-section">
          <div className="document-details-section-heading">
            <div>
              <span className="document-details-eyebrow">
                Extracted content
              </span>

              <h2>Document text</h2>
            </div>

            <span className="document-details-character-count">
              {(
                document.extracted_text_length || 0
              ).toLocaleString()}{" "}
              characters
            </span>
          </div>

          {chunks.length > 0 ? (
            <div className="document-details-chunks">
              {chunks.map((chunk) => {
                const isRelevant =
                  requestedChunkIndex !== null &&
                  chunk.chunk_index ===
                    requestedChunkIndex;

                return (
                  <article
                    key={chunk.id}
                    ref={
                      isRelevant
                        ? highlightedChunkRef
                        : null
                    }
                    className={`document-details-chunk ${
                      isRelevant
                        ? "document-details-chunk--highlighted"
                        : ""
                    }`}
                  >
                    <div className="document-details-chunk-header">
                      <div className="document-details-chunk-label">
                        <Hash size={14} />
                        Chunk {chunk.chunk_index + 1}
                      </div>

                      {isRelevant && (
                        <span className="document-details-relevant-label">
                          Relevant source
                        </span>
                      )}
                    </div>

                    <div className="document-details-chunk-content">
                      {chunk.content}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="document-details-text">
              {document.extracted_text ? (
                document.extracted_text
              ) : (
                <div className="document-details-empty-content">
                  <FileText size={24} />
                  <p>
                    No extracted text is available for
                    this document.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default DocumentDetails;
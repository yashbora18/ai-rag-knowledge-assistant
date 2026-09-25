import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  ChevronDown,
  ChevronUp,
  FileText,
  Hash,
  Sparkles,
} from "lucide-react";

import "./SourceCard.css";

function SourceCard({ source, index }) {
  const navigate = useNavigate();

  const [isExpanded, setIsExpanded] = useState(false);

  const similarity = Math.round(
    Number(source?.similarity || 0) * 100
  );

  const sourceContent =
    source?.content || "No source content available.";

  const documentId = source?.document_id;

  const chunkIndex =
    source?.chunk_index !== undefined &&
    source?.chunk_index !== null
      ? source.chunk_index
      : 0;

  const handleOpenDocument = () => {
    if (!documentId) {
      return;
    }

    navigate(
      `/documents/${encodeURIComponent(
        documentId
      )}?chunk_index=${encodeURIComponent(
        chunkIndex
      )}`
    );
  };

  return (
    <div
      className={`source-card ${
        isExpanded ? "expanded" : ""
      }`}
    >
      <div className="source-card-header">
        <div className="source-card-title">
          <div className="source-icon">
            <FileText size={17} />
          </div>

          <div className="source-card-title-content">
            <span className="source-label">
              Source {index + 1}
            </span>

            <button
              type="button"
              className="source-document-button"
              onClick={handleOpenDocument}
              disabled={!documentId}
              title={
                documentId
                  ? "Open document"
                  : "Document unavailable"
              }
            >
              Document #{documentId}
            </button>
          </div>
        </div>

        <div className="source-similarity">
          <Sparkles size={13} />
          {similarity}%
        </div>
      </div>

      <div className="source-card-meta">
        <span>
          <Hash size={13} />
          Chunk {chunkIndex + 1}
        </span>
      </div>

      <div
        className={`source-card-content ${
          isExpanded ? "is-expanded" : ""
        }`}
      >
        {sourceContent}
      </div>

      <div className="source-card-actions">
        <button
          type="button"
          className="source-expand-button"
          onClick={() =>
            setIsExpanded((current) => !current)
          }
          aria-expanded={isExpanded}
        >
          {isExpanded ? (
            <>
              Hide source
              <ChevronUp size={15} />
            </>
          ) : (
            <>
              View full source
              <ChevronDown size={15} />
            </>
          )}
        </button>

        <button
          type="button"
          className="source-open-button"
          onClick={handleOpenDocument}
          disabled={!documentId}
          title={
            documentId
              ? "Open document"
              : "Document unavailable"
          }
        >
          <FileText size={14} />
          Open document
        </button>
      </div>
    </div>
  );
}

export default SourceCard;
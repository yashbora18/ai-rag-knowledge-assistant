import {
  CheckCircle2,
  FileText,
  Upload,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import Button from "../../components/common/Button/Button";

import { createDocument } from "../../services/documentService";
import { useToast } from "../../hooks/useToast";

import "./DocumentUploadModal.css";


const ALLOWED_EXTENSIONS = [
  "pdf",
  "docx",
  "txt",
  "md",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024;


function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) {
    return "0 KB";
  }

  if (bytes >= 1024 * 1024) {
    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  }

  return `${Math.max(
    1,
    Math.round(bytes / 1024)
  )} KB`;
}


function getExtension(filename = "") {
  return (
    filename
      .split(".")
      .pop()
      ?.toLowerCase() || ""
  );
}


function DocumentUploadModal({
  isOpen,
  onClose,
  onUpload,
}) {
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [isDragging, setIsDragging] =
    useState(false);

  const [isUploading, setIsUploading] =
    useState(false);

  const { error: showError } = useToast();


  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleEscape = (event) => {
      if (
        event.key === "Escape" &&
        !isUploading
      ) {
        handleClose();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isOpen, isUploading]);


  if (!isOpen) {
    return null;
  }


  const handleFile = (file) => {
    if (!file) {
      return;
    }

    const extension =
      getExtension(file.name);

    if (
      !ALLOWED_EXTENSIONS.includes(extension)
    ) {
      showError(
        "Please select a PDF, DOCX, TXT, or MD file.",
        "Unsupported file type"
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showError(
        "File size must be 20 MB or smaller.",
        "File too large"
      );
      return;
    }

    setSelectedFile(file);
  };


  const handleInputChange = (event) => {
    const file =
      event.target.files?.[0];

    handleFile(file);

    event.target.value = "";
  };


  const handleDrop = (event) => {
    event.preventDefault();

    if (isUploading) {
      return;
    }

    setIsDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    handleFile(file);
  };


  const handleDragOver = (event) => {
    event.preventDefault();

    if (!isUploading) {
      setIsDragging(true);
    }
  };


  const handleDragLeave = (event) => {
    event.preventDefault();

    setIsDragging(false);
  };


  const handleBrowse = () => {
    if (isUploading) {
      return;
    }

    fileInputRef.current?.click();
  };


  const handleUpload = async () => {
    if (
      !selectedFile ||
      isUploading
    ) {
      return;
    }

    setIsUploading(true);

    try {
      const document =
        await createDocument(
          selectedFile
        );

      onUpload(document);

      setSelectedFile(null);
      setIsDragging(false);

      onClose();
    } catch (error) {
      const detail =
        error?.response?.data?.detail;

      showError(
        detail ||
          "Unable to upload the document.",
        error?.response?.status === 409
          ? "Duplicate document"
          : "Upload failed"
      );
    } finally {
      setIsUploading(false);
    }
  };


  const handleClose = () => {
    if (isUploading) {
      return;
    }

    setSelectedFile(null);
    setIsDragging(false);

    onClose();
  };


  return (
    <div
      className="document-upload-modal__overlay"
      onMouseDown={handleClose}
    >
      <div
        className="document-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-upload-title"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="document-upload-modal__header">
          <div>
            <div className="document-upload-modal__eyebrow">
              <Upload size={14} />
              Knowledge source
            </div>

            <h2
              id="document-upload-title"
              className="document-upload-modal__title"
            >
              Upload document
            </h2>

            <p className="document-upload-modal__subtitle">
              Add a document to your AI
              knowledge base.
            </p>
          </div>

          <button
            type="button"
            className="document-upload-modal__close"
            onClick={handleClose}
            aria-label="Close upload dialog"
            disabled={isUploading}
          >
            <X size={19} />
          </button>
        </div>


        <div className="document-upload-modal__body">
          {!selectedFile ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                className="document-upload-modal__input"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleInputChange}
                disabled={isUploading}
              />

              <button
                type="button"
                className={`document-upload-modal__dropzone ${
                  isDragging
                    ? "document-upload-modal__dropzone--active"
                    : ""
                }`}
                onClick={handleBrowse}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                disabled={isUploading}
              >
                <div className="document-upload-modal__upload-icon">
                  <Upload size={24} />
                </div>

                <div className="document-upload-modal__dropzone-title">
                  Drop your document here
                </div>

                <div className="document-upload-modal__dropzone-text">
                  or click to browse from your computer
                </div>

                <div className="document-upload-modal__formats">
                  PDF · DOCX · TXT · MD · Max 20 MB
                </div>
              </button>
            </>
          ) : (
            <div className="document-upload-modal__selected">
              <div className="document-upload-modal__selected-icon">
                <FileText size={22} />
              </div>

              <div className="document-upload-modal__selected-info">
                <div className="document-upload-modal__selected-name">
                  {selectedFile.name}
                </div>

                <div className="document-upload-modal__selected-size">
                  {formatFileSize(
                    selectedFile.size
                  )}
                </div>
              </div>

              <CheckCircle2
                size={21}
                className="document-upload-modal__selected-check"
              />

              <button
                type="button"
                className="document-upload-modal__remove"
                onClick={() =>
                  setSelectedFile(null)
                }
                aria-label="Remove selected file"
                disabled={isUploading}
              >
                <X size={17} />
              </button>
            </div>
          )}
        </div>


        <div className="document-upload-modal__footer">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>

          <Button
            disabled={
              !selectedFile ||
              isUploading
            }
            loading={isUploading}
            onClick={handleUpload}
          >
            {!isUploading && (
              <Upload size={16} />
            )}

            {isUploading
              ? "Uploading..."
              : "Upload document"}
          </Button>
        </div>
      </div>
    </div>
  );
}


export default DocumentUploadModal;
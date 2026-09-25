import {
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Grid2X2,
  List,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import Button from "../../components/common/Button/Button";
import Sidebar from "../../components/layout/Sidebar/Sidebar";
import Navbar from "../../components/layout/Navbar/Navbar";
import Modal from "../../components/common/Modal/Modal";

import DocumentUploadModal from "./DocumentUploadModal";

import { useToast } from "../../hooks/useToast";

import {
  getDocuments,
  deleteDocument,
} from "../../services/documentService";

import "./Documents.css";


/* =========================================================
   HELPERS
========================================================= */

function formatFileSize(bytes) {
  if (!bytes || Number(bytes) <= 0) {
    return "0 KB";
  }

  const size = Number(bytes);

  if (size >= 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  }

  return `${Math.max(
    1,
    Math.round(size / 1024)
  )} KB`;
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


function getFileType(filename = "") {
  const extension =
    filename.split(".").pop()?.toLowerCase() || "";

  const typeMap = {
    pdf: "PDF",
    docx: "DOCX",
    doc: "DOC",
    txt: "Text",
    md: "Markdown",
    markdown: "Markdown",
    csv: "CSV",
    json: "JSON",
  };

  return typeMap[extension] || "Document";
}


function getDocumentStatus(document) {
  const status = String(
    document?.status || "processing"
  ).toLowerCase();

  if (
    status === "ready" ||
    status === "indexed" ||
    status === "completed"
  ) {
    return "Indexed";
  }

  if (
    status === "failed" ||
    status === "error"
  ) {
    return "Failed";
  }

  return "Processing";
}


/* =========================================================
   DOCUMENTS PAGE
========================================================= */

function Documents() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();

  const [view, setView] = useState("grid");

  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState("recent");

  const [sortMenuOpen, setSortMenuOpen] =
    useState(false);

  const sortMenuRef = useRef(null);

  const [documents, setDocuments] = useState([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [uploadModalOpen, setUploadModalOpen] =
    useState(false);

  const [
    highlightedDocumentId,
    setHighlightedDocumentId,
  ] = useState(null);

  const [
    documentToDelete,
    setDocumentToDelete,
  ] = useState(null);

  const {
    success,
    error: showError,
  } = useToast();


  /* =========================================================
     LOAD DOCUMENTS
  ========================================================= */

  const loadDocuments = useCallback(
    async ({ showLoading = true } = {}) => {
      try {
        if (showLoading) {
          setIsLoading(true);
        }

        setIsRefreshing(true);

        const data = await getDocuments(search);

        const documentList =
          Array.isArray(data)
            ? data
            : Array.isArray(data?.documents)
              ? data.documents
              : [];

        setDocuments(documentList);
      } catch (error) {
        setDocuments([]);

        showError(
          error?.response?.data?.detail ||
            "Unable to load documents.",
          "Documents unavailable"
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [search, showError]
  );


  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadDocuments({
        showLoading: true,
      });
    }, 300);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadDocuments]);


  /* =========================================================
     REFRESH
  ========================================================= */

  const handleRefresh = async () => {
    if (isRefreshing) {
      return;
    }

    await loadDocuments({
      showLoading: false,
    });
  };


  /* =========================================================
     SORT DROPDOWN
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        sortMenuRef.current &&
        !sortMenuRef.current.contains(
          event.target
        )
      ) {
        setSortMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSortMenuOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, []);


  const handleSortChange = (value) => {
    setSortBy(value);
    setSortMenuOpen(false);
  };


  const sortOptions = [
    {
      value: "recent",
      label: "Recently added",
    },
    {
      value: "name",
      label: "Name",
    },
    {
      value: "size",
      label: "File size",
    },
  ];


  const selectedSortLabel =
    sortOptions.find(
      (option) => option.value === sortBy
    )?.label || "Recently added";


  /* =========================================================
     DOCUMENT DEEP LINK

     Example:
     /documents?document_id=5
  ========================================================= */

  useEffect(() => {
    const documentId =
      searchParams.get("document_id");

    if (
      !documentId ||
      documents.length === 0
    ) {
      return;
    }

    const targetDocument = documents.find(
      (document) =>
        String(document.id) ===
        String(documentId)
    );

    if (!targetDocument) {
      return;
    }

    if (search) {
      setSearch("");
      return;
    }

    setHighlightedDocumentId(
      String(documentId)
    );

    const scrollTimeout = setTimeout(() => {
      const element =
        document.querySelector(
          `[data-document-id="${documentId}"]`
        );

      if (element) {
        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 150);

    const highlightTimeout = setTimeout(() => {
      setHighlightedDocumentId(null);
    }, 3500);

    return () => {
      clearTimeout(scrollTimeout);
      clearTimeout(highlightTimeout);
    };
  }, [
    documents,
    searchParams,
    search,
  ]);


  /* =========================================================
     SORT DOCUMENTS
  ========================================================= */

  const sortedDocuments = [
    ...documents,
  ].sort((a, b) => {
    if (sortBy === "name") {
      const nameA = (
        a.filename ||
        a.name ||
        ""
      ).toLowerCase();

      const nameB = (
        b.filename ||
        b.name ||
        ""
      ).toLowerCase();

      return nameA.localeCompare(nameB);
    }

    if (sortBy === "size") {
      return (
        Number(b.file_size || 0) -
        Number(a.file_size || 0)
      );
    }

    const dateA = new Date(
      a.created_at || 0
    ).getTime();

    const dateB = new Date(
      b.created_at || 0
    ).getTime();

    return dateB - dateA;
  });


  /* =========================================================
     REAL DOCUMENT STATISTICS
  ========================================================= */

  const totalDocuments =
    documents.length;

  const indexedDocuments =
    documents.filter(
      (document) =>
        getDocumentStatus(document) ===
        "Indexed"
    ).length;

  const processingDocuments =
    documents.filter(
      (document) =>
        getDocumentStatus(document) ===
        "Processing"
    ).length;

  const failedDocuments =
    documents.filter(
      (document) =>
        getDocumentStatus(document) ===
        "Failed"
    ).length;


  /* =========================================================
     UPLOAD
  ========================================================= */

  const handleOpenUploadModal = () => {
    setUploadModalOpen(true);
  };


  const handleCloseUploadModal = () => {
    setUploadModalOpen(false);
  };


  const handleDocumentUploaded = (
    document
  ) => {
    if (!document) {
      return;
    }

    const query = search
      .trim()
      .toLowerCase();

    const documentName = (
      document.filename ||
      document.name ||
      ""
    ).toLowerCase();

    if (
      !query ||
      documentName.includes(query)
    ) {
      setDocuments(
        (currentDocuments) => [
          document,
          ...currentDocuments,
        ]
      );
    }

    setUploadModalOpen(false);

    success(
      `"${document.filename || document.name || "Document"}" uploaded successfully.`
    );
  };


  /* =========================================================
     DELETE
  ========================================================= */

  const handleDeleteDocument = async () => {
    if (!documentToDelete) {
      return;
    }

    const documentId =
      documentToDelete.id;

    const documentName =
      documentToDelete.filename ||
      documentToDelete.name ||
      "Document";

    try {
      await deleteDocument(
        documentId
      );

      setDocuments(
        (currentDocuments) =>
          currentDocuments.filter(
            (document) =>
              String(document.id) !==
              String(documentId)
          )
      );

      setDocumentToDelete(null);

      success(
        `"${documentName}" deleted successfully.`
      );
    } catch (error) {
      showError(
        error?.response?.data?.detail ||
          "Unable to delete the document.",
        "Delete failed"
      );
    }
  };


  /* =========================================================
     OPEN DETAILS
  ========================================================= */

  const handleOpenDetails = (
    documentId
  ) => {
    if (!documentId) {
      return;
    }

    navigate(
      `/documents/${documentId}`
    );
  };


  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="documents-page">

      <Navbar />

      <div className="documents-page__app">

        <Sidebar />

        <main className="documents-page__main">

          {/* HEADER */}

          <header className="documents-page__header">

            <div>

              <div className="documents-page__eyebrow">
                <FileText size={14} />
                Knowledge sources
              </div>

              <h1 className="documents-page__title">
                Documents
              </h1>

              <p className="documents-page__subtitle">
                Upload and manage the documents
                that power your AI knowledge
                assistant.
              </p>

            </div>


            <div className="documents-page__header-actions">

              <button
                type="button"
                className="documents-page__refresh"
                onClick={handleRefresh}
                disabled={isRefreshing}
                aria-label="Refresh documents"
                title="Refresh documents"
              >
                <RefreshCw
                  size={15}
                  className={
                    isRefreshing
                      ? "documents-page__refresh-icon--spinning"
                      : ""
                  }
                />

                {isRefreshing
                  ? "Refreshing..."
                  : "Refresh"}
              </button>


              <Button
                onClick={
                  handleOpenUploadModal
                }
                disabled={isRefreshing}
              >
                <Plus size={17} />
                Upload document
              </Button>

            </div>

          </header>


          {/* STATISTICS */}

          <section
            className="documents-page__stats"
            aria-label="Document statistics"
          >

            <article className="documents-page__stat-card">

              <div className="documents-page__stat-icon documents-page__stat-icon--total">
                <FileText size={18} />
              </div>

              <div className="documents-page__stat-content">

                <span className="documents-page__stat-label">
                  Total documents
                </span>

                <strong className="documents-page__stat-value">
                  {isLoading
                    ? "—"
                    : totalDocuments}
                </strong>

              </div>

            </article>


            <article className="documents-page__stat-card">

              <div className="documents-page__stat-icon documents-page__stat-icon--indexed">
                <CheckCircle2 size={18} />
              </div>

              <div className="documents-page__stat-content">

                <span className="documents-page__stat-label">
                  Indexed
                </span>

                <strong className="documents-page__stat-value">
                  {isLoading
                    ? "—"
                    : indexedDocuments}
                </strong>

              </div>

            </article>


            <article className="documents-page__stat-card">

              <div className="documents-page__stat-icon documents-page__stat-icon--processing">
                <Clock3 size={18} />
              </div>

              <div className="documents-page__stat-content">

                <span className="documents-page__stat-label">
                  Processing
                </span>

                <strong className="documents-page__stat-value">
                  {isLoading
                    ? "—"
                    : processingDocuments}
                </strong>

              </div>

            </article>


            <article className="documents-page__stat-card">

              <div className="documents-page__stat-icon documents-page__stat-icon--failed">
                <XCircle size={18} />
              </div>

              <div className="documents-page__stat-content">

                <span className="documents-page__stat-label">
                  Failed
                </span>

                <strong className="documents-page__stat-value">
                  {isLoading
                    ? "—"
                    : failedDocuments}
                </strong>

              </div>

            </article>

          </section>


          {/* TOOLBAR */}

          <div className="documents-page__toolbar">

            <div className="documents-page__search">

              <Search
                size={17}
                className="documents-page__search-icon"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search documents..."
                className="documents-page__search-input"
                aria-label="Search documents"
              />

            </div>


            <div className="documents-page__filters">

              <button
                type="button"
                className="documents-page__filter-group"
                aria-label="Document filters"
              >
                <SlidersHorizontal
                  size={14}
                />
                Filter
              </button>


              {/* CUSTOM SORT DROPDOWN */}

              <div
                className="documents-page__sort"
                ref={sortMenuRef}
              >

                <button
                  type="button"
                  className={`documents-page__sort-button ${
                    sortMenuOpen
                      ? "documents-page__sort-button--open"
                      : ""
                  }`}
                  onClick={() =>
                    setSortMenuOpen(
                      (current) =>
                        !current
                    )
                  }
                  aria-haspopup="listbox"
                  aria-expanded={
                    sortMenuOpen
                  }
                  aria-label="Sort documents"
                >

                  <span>
                    {selectedSortLabel}
                  </span>

                  <ChevronDown
                    size={16}
                    className={
                      sortMenuOpen
                        ? "documents-page__sort-chevron--open"
                        : ""
                    }
                  />

                </button>


                {sortMenuOpen && (
                  <div
                    className="documents-page__sort-menu"
                    role="listbox"
                    aria-label="Sort documents"
                  >

                    {sortOptions.map(
                      (option) => {
                        const isActive =
                          sortBy ===
                          option.value;

                        return (
                          <button
                            key={
                              option.value
                            }
                            type="button"
                            role="option"
                            aria-selected={
                              isActive
                            }
                            className={`documents-page__sort-option ${
                              isActive
                                ? "documents-page__sort-option--active"
                                : ""
                            }`}
                            onClick={() =>
                              handleSortChange(
                                option.value
                              )
                            }
                          >

                            <span>
                              {option.label}
                            </span>

                            {isActive && (
                              <Check
                                size={15}
                              />
                            )}

                          </button>
                        );
                      }
                    )}

                  </div>
                )}

              </div>

            </div>

          </div>


          {/* SUMMARY */}

          <div className="documents-page__summary">

            <span className="documents-page__summary-text">

              {isLoading
                ? "Loading documents..."
                : `${documents.length} ${
                    documents.length === 1
                      ? "document"
                      : "documents"
                  }`}

            </span>


            <div className="documents-page__view-toggle">

              <button
                type="button"
                className={`documents-page__view-button ${
                  view === "grid"
                    ? "documents-page__view-button--active"
                    : ""
                }`}
                onClick={() =>
                  setView("grid")
                }
                aria-label="Grid view"
                title="Grid view"
              >
                <Grid2X2 size={15} />
              </button>


              <button
                type="button"
                className={`documents-page__view-button ${
                  view === "list"
                    ? "documents-page__view-button--active"
                    : ""
                }`}
                onClick={() =>
                  setView("list")
                }
                aria-label="List view"
                title="List view"
              >
                <List size={16} />
              </button>

            </div>

          </div>


          {/* LOADING */}

          {isLoading && (
            <section className="documents-page__grid">

              <article className="documents-page__card">

                <div className="documents-page__file-icon documents-page__file-icon--static">
                  <Loader2
                    size={21}
                    className="documents-page__loading-icon"
                  />
                </div>

                <h2 className="documents-page__card-title">
                  {search.trim()
                    ? "Searching documents..."
                    : "Loading documents..."}
                </h2>

                <p className="documents-page__card-description">
                  Fetching your knowledge
                  sources from the database.
                </p>

              </article>

            </section>
          )}


          {/* GRID VIEW */}

          {!isLoading &&
            view === "grid" &&
            sortedDocuments.length > 0 && (

              <section
                className="documents-page__grid"
                aria-label="Documents"
              >

                {sortedDocuments.map(
                  (document) => {

                    const name =
                      document.filename ||
                      document.name ||
                      "Untitled document";

                    const type =
                      document.type ||
                      getFileType(name);

                    const size =
                      document.file_size !==
                      undefined
                        ? formatFileSize(
                            document.file_size
                          )
                        : document.size ||
                          "Unknown size";

                    const chunks =
                      document.chunk_count !==
                      undefined
                        ? `${document.chunk_count} chunks`
                        : document.chunks !==
                            undefined
                          ? document.chunks
                          : "0 chunks";

                    const added =
                      document.created_at
                        ? formatDate(
                            document.created_at
                          )
                        : document.added ||
                          "Unknown date";

                    const status =
                      getDocumentStatus(
                        document
                      );

                    const statusClass =
                      status === "Indexed"
                        ? "documents-page__status--indexed"
                        : status === "Failed"
                          ? "documents-page__status--failed"
                          : "documents-page__status--processing";

                    const isHighlighted =
                      String(
                        highlightedDocumentId
                      ) ===
                      String(document.id);

                    return (
                      <article
                        key={document.id}
                        data-document-id={
                          document.id
                        }
                        className={`documents-page__card ${
                          isHighlighted
                            ? "documents-page__card--highlighted"
                            : ""
                        }`}
                      >

                        <div className="documents-page__card-top">

                          <button
                            type="button"
                            className="documents-page__file-icon"
                            onClick={() =>
                              handleOpenDetails(
                                document.id
                              )
                            }
                            aria-label={`Open ${name}`}
                            title={`Open ${name}`}
                          >
                            <FileText
                              size={21}
                            />
                          </button>


                          <button
                            type="button"
                            className="documents-page__menu"
                            aria-label={`Delete ${name}`}
                            title={`Delete ${name}`}
                            onClick={() =>
                              setDocumentToDelete(
                                document
                              )
                            }
                          >
                            <MoreHorizontal
                              size={18}
                            />
                          </button>

                        </div>


                        <h2 className="documents-page__card-title">
                          {name}
                        </h2>


                        <p className="documents-page__card-description">
                          Indexed knowledge
                          source ready for
                          AI-powered retrieval
                          and conversations.
                        </p>


                        <div className="documents-page__card-meta">

                          <span>{type}</span>

                          <span>•</span>

                          <span>{size}</span>

                          <span>•</span>

                          <span>{chunks}</span>

                        </div>


                        <div
                          className={`documents-page__status ${statusClass}`}
                        >
                          <span className="documents-page__status-dot" />
                          {status}
                        </div>


                        <div className="documents-page__card-footer">

                          <span>
                            Added {added}
                          </span>


                          <button
                            type="button"
                            className="documents-page__details-button"
                            onClick={() =>
                              handleOpenDetails(
                                document.id
                              )
                            }
                          >
                            Open details →
                          </button>

                        </div>

                      </article>
                    );
                  }
                )}

              </section>
            )}


          {/* LIST VIEW */}

          {!isLoading &&
            view === "list" &&
            sortedDocuments.length > 0 && (

              <section
                className="documents-page__list"
                aria-label="Documents list"
              >

                <div className="documents-page__list-header">

                  <span>
                    Document
                  </span>

                  <span>
                    Size
                  </span>

                  <span>
                    Added
                  </span>

                  <span>
                    Status
                  </span>

                  <span />

                </div>


                {sortedDocuments.map(
                  (document) => {

                    const name =
                      document.filename ||
                      document.name ||
                      "Untitled document";

                    const size =
                      document.file_size !==
                      undefined
                        ? formatFileSize(
                            document.file_size
                          )
                        : document.size ||
                          "Unknown size";

                    const added =
                      document.created_at
                        ? formatDate(
                            document.created_at
                          )
                        : "Unknown date";

                    const status =
                      getDocumentStatus(
                        document
                      );

                    const isHighlighted =
                      String(
                        highlightedDocumentId
                      ) ===
                      String(document.id);

                    return (
                      <div
                        key={document.id}
                        data-document-id={
                          document.id
                        }
                        className={`documents-page__list-row ${
                          isHighlighted
                            ? "documents-page__list-row--highlighted"
                            : ""
                        }`}
                      >

                        <button
                          type="button"
                          className="documents-page__list-document"
                          onClick={() =>
                            handleOpenDetails(
                              document.id
                            )
                          }
                        >

                          <div className="documents-page__list-icon">
                            <FileText
                              size={18}
                            />
                          </div>

                          <div>

                            <div className="documents-page__list-name">
                              {name}
                            </div>

                            <div className="documents-page__list-subtitle">
                              {getFileType(name)}
                            </div>

                          </div>

                        </button>


                        <span className="documents-page__list-cell">
                          {size}
                        </span>


                        <span className="documents-page__list-cell">
                          {added}
                        </span>


                        <span
                          className={`documents-page__list-status ${
                            status === "Failed"
                              ? "documents-page__list-status--failed"
                              : status === "Processing"
                                ? "documents-page__list-status--processing"
                                : ""
                          }`}
                        >
                          <span className="documents-page__status-dot" />
                          {status}
                        </span>


                        <button
                          type="button"
                          className="documents-page__list-action"
                          aria-label={`Delete ${name}`}
                          title={`Delete ${name}`}
                          onClick={() =>
                            setDocumentToDelete(
                              document
                            )
                          }
                        >
                          <MoreHorizontal
                            size={17}
                          />
                        </button>

                      </div>
                    );
                  }
                )}

              </section>
            )}


          {/* EMPTY STATE */}

          {!isLoading &&
            documents.length === 0 && (

              <div className="documents-page__empty">

                <div className="documents-page__empty-icon">
                  <Search size={21} />
                </div>

                <h2>
                  {search.trim()
                    ? "No documents found"
                    : "No documents yet"}
                </h2>

                <p>
                  {search.trim()
                    ? `No documents match "${search}". Try a different search term.`
                    : "Upload your first document to start building your AI knowledge base."}
                </p>

                {!search.trim() && (
                  <button
                    type="button"
                    className="documents-page__empty-action"
                    onClick={
                      handleOpenUploadModal
                    }
                  >
                    <Plus size={15} />
                    Upload document
                  </button>
                )}

              </div>
            )}

        </main>

      </div>


      {/* DELETE MODAL */}

      <Modal
        isOpen={Boolean(
          documentToDelete
        )}
        onClose={() =>
          setDocumentToDelete(null)
        }
        title="Delete document?"
        size="small"
      >

        <div className="documents-delete-confirmation">

          <p>
            Are you sure you want to
            delete{" "}
            <strong>
              {documentToDelete?.filename ||
                documentToDelete?.name ||
                "this document"}
            </strong>
            ?
          </p>

          <span>
            This will permanently remove
            the document and its indexed
            knowledge chunks. This action
            cannot be undone.
          </span>

          <div className="documents-delete-confirmation__actions">

            <Button
              type="button"
              variant="secondary"
              size="medium"
              onClick={() =>
                setDocumentToDelete(null)
              }
            >
              Cancel
            </Button>

            <Button
              type="button"
              variant="danger"
              size="medium"
              onClick={
                handleDeleteDocument
              }
            >
              Delete
            </Button>

          </div>

        </div>

      </Modal>


      {/* UPLOAD MODAL */}

      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={
          handleCloseUploadModal
        }
        onUpload={
          handleDocumentUploaded
        }
      />

    </div>
  );
}


export default Documents;
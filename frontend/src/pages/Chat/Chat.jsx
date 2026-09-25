import { useEffect, useRef, useState } from "react";

import {
  ArrowLeft,
  Bot,
  Check,
  ChevronDown,
  FileText,
  Files,
  MessageSquare,
  Moon,
  Plus,
  Send,
  Sun,
  Trash2,
  User,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  deleteConversation,
  getConversation,
  getConversations,
  sendChatMessage,
} from "../../services/chatService";

import { getDocuments } from "../../services/documentService";

import { useToast } from "../../context/ToastContext";

import { useTheme } from "../../hooks/useTheme";

import Modal from "../../components/common/Modal/Modal";
import Button from "../../components/common/Button/Button";

import SourceCard from "./SourceCard";

import "./Chat.css";

function Chat() {
  const navigate = useNavigate();

  const { success, error } = useToast();

  const { theme, toggleTheme } = useTheme();

  const [conversations, setConversations] = useState([]);

  const [activeConversationId, setActiveConversationId] =
    useState(null);

  const [messages, setMessages] = useState([]);

  const [question, setQuestion] = useState("");

  const [isLoadingConversations, setIsLoadingConversations] =
    useState(true);

  const [isLoadingMessages, setIsLoadingMessages] =
    useState(false);

  const [isSending, setIsSending] = useState(false);

  const [conversationToDelete, setConversationToDelete] =
    useState(null);

  /*
   * =========================================================
   * DOCUMENT CONTEXT
   * =========================================================
   */

  const [documents, setDocuments] = useState([]);

  const [selectedDocumentIds, setSelectedDocumentIds] =
    useState([]);

  const [isLoadingDocuments, setIsLoadingDocuments] =
    useState(true);

  const [isDocumentSelectorOpen, setIsDocumentSelectorOpen] =
    useState(false);

  const messagesEndRef = useRef(null);

  const documentSelectorRef = useRef(null);

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {
    loadConversations();
    loadDocuments();
  }, []);

  /*
   * =========================================================
   * CLOSE DOCUMENT SELECTOR
   * =========================================================
   */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        documentSelectorRef.current &&
        !documentSelectorRef.current.contains(event.target)
      ) {
        setIsDocumentSelectorOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsDocumentSelectorOpen(false);
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

  /*
   * =========================================================
   * AUTO SCROLL
   * =========================================================
   */

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isSending]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    });
  };

  /*
   * =========================================================
   * LOAD DOCUMENTS
   * =========================================================
   */

  const loadDocuments = async () => {
    setIsLoadingDocuments(true);

    try {
      const data = await getDocuments();

      setDocuments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      error(
        err.response?.data?.detail ||
          "Unable to load documents."
      );

      setDocuments([]);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  /*
   * =========================================================
   * DOCUMENT SELECTION
   * =========================================================
   *
   * Empty selectedDocumentIds means:
   * "All documents"
   */

  const toggleDocumentSelection = (documentId) => {
    const numericId = Number(documentId);

    setSelectedDocumentIds((currentIds) => {
      if (currentIds.includes(numericId)) {
        return currentIds.filter(
          (id) => id !== numericId
        );
      }

      return [
        ...currentIds,
        numericId,
      ];
    });
  };

  const selectAllDocuments = () => {
    setSelectedDocumentIds([]);
  };

  const clearDocumentSelection = () => {
    setSelectedDocumentIds([]);
  };

  const getDocumentScopeLabel = () => {
    if (isLoadingDocuments) {
      return "Loading documents";
    }

    if (documents.length === 0) {
      return "No documents";
    }

    if (selectedDocumentIds.length === 0) {
      return "All documents";
    }

    if (selectedDocumentIds.length === 1) {
      const selectedDocument = documents.find(
        (document) =>
          Number(document.id) ===
          selectedDocumentIds[0]
      );

      return (
        selectedDocument?.filename ||
        "1 document"
      );
    }

    return `${selectedDocumentIds.length} documents`;
  };

  /*
   * =========================================================
   * LOAD CONVERSATIONS
   * =========================================================
   */

  const loadConversations = async () => {
    setIsLoadingConversations(true);

    try {
      const data = await getConversations();

      setConversations(
        Array.isArray(data)
          ? data
          : []
      );

      if (data.length > 0) {
        await openConversation(data[0].id);
      } else {
        setActiveConversationId(null);
        setMessages([]);
      }
    } catch (err) {
      error(
        err.response?.data?.detail ||
          "Unable to load conversations."
      );
    } finally {
      setIsLoadingConversations(false);
    }
  };

  /*
   * =========================================================
   * OPEN CONVERSATION
   * =========================================================
   */

  const openConversation = async (
    conversationId
  ) => {
    setActiveConversationId(conversationId);

    setIsLoadingMessages(true);

    try {
      const data = await getConversation(
        conversationId
      );

      const loadedMessages =
        (data.messages || []).map(
          (message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            created_at: message.created_at,
            sources: message.sources || [],
          })
        );

      setMessages(loadedMessages);
    } catch (err) {
      error(
        err.response?.data?.detail ||
          "Unable to load conversation."
      );
    } finally {
      setIsLoadingMessages(false);
    }
  };

  /*
   * =========================================================
   * NEW CONVERSATION
   * =========================================================
   */

  const startNewConversation = () => {
    setActiveConversationId(null);

    setMessages([]);

    setQuestion("");

    /*
     * A new conversation starts with the complete
     * knowledge base available.
     */

    setSelectedDocumentIds([]);

    setIsDocumentSelectorOpen(false);
  };

  /*
   * =========================================================
   * SEND MESSAGE
   * =========================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedQuestion = question.trim();

    if (
      !trimmedQuestion ||
      isSending
    ) {
      return;
    }

    setIsSending(true);

    try {
      /*
       * Empty array = all documents.
       *
       * Otherwise only the selected document IDs
       * are passed to the backend.
       */

      const documentIds =
        selectedDocumentIds.length > 0
          ? selectedDocumentIds
          : null;

      const response =
        await sendChatMessage(
          trimmedQuestion,
          activeConversationId,
          documentIds
        );

      const timestamp =
        new Date().toISOString();

      const userMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmedQuestion,
        created_at: timestamp,
        sources: [],
      };

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: response.answer,
        created_at: timestamp,
        sources: response.sources || [],
      };

      setMessages(
        (currentMessages) => [
          ...currentMessages,
          userMessage,
          assistantMessage,
        ]
      );

      setQuestion("");

      if (!activeConversationId) {
        setActiveConversationId(
          response.conversation_id
        );

        const updatedConversations =
          await getConversations();

        setConversations(
          updatedConversations
        );
      } else {
        setConversations(
          (current) =>
            current.map(
              (conversation) =>
                conversation.id ===
                response.conversation_id
                  ? {
                      ...conversation,
                      updated_at:
                        new Date().toISOString(),
                    }
                  : conversation
            )
        );
      }

      success(
        selectedDocumentIds.length > 0
          ? `Answer generated using ${selectedDocumentIds.length} selected ${
              selectedDocumentIds.length === 1
                ? "document"
                : "documents"
            }.`
          : "Answer generated successfully."
      );
    } catch (err) {
      error(
        err.response?.data?.detail ||
          "Unable to generate an answer."
      );
    } finally {
      setIsSending(false);
    }
  };

  /*
   * =========================================================
   * DELETE CONVERSATION
   * =========================================================
   */

  const handleDeleteConversation = async (
    conversationId
  ) => {
    try {
      await deleteConversation(
        conversationId
      );

      const remaining =
        conversations.filter(
          (conversation) =>
            conversation.id !==
            conversationId
        );

      setConversations(remaining);

      if (
        activeConversationId ===
        conversationId
      ) {
        if (remaining.length > 0) {
          await openConversation(
            remaining[0].id
          );
        } else {
          startNewConversation();
        }
      }

      success(
        "Conversation deleted."
      );
    } catch (err) {
      error(
        err.response?.data?.detail ||
          "Unable to delete conversation."
      );
    }
  };

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="chat-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="chat-sidebar">
        <div className="chat-sidebar-header">
          <div>
            <span className="chat-eyebrow">
              Knowledge Assistant
            </span>

            <h1>
              Conversations
            </h1>
          </div>

          <button
            type="button"
            className="chat-new-button"
            onClick={startNewConversation}
            title="New conversation"
            aria-label="New conversation"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="chat-conversation-list">
          {isLoadingConversations ? (
            <div className="chat-sidebar-state">
              Loading conversations...
            </div>
          ) : conversations.length === 0 ? (
            <div className="chat-sidebar-state">
              <MessageSquare
                size={22}
              />

              <p>
                No conversations yet.
              </p>

              <span>
                Ask a question to start one.
              </span>
            </div>
          ) : (
            conversations.map(
              (conversation) => (
                <div
                  key={conversation.id}
                  className={`chat-conversation-item ${
                    activeConversationId ===
                    conversation.id
                      ? "active"
                      : ""
                  }`}
                >
                  <button
                    type="button"
                    className="chat-conversation-select"
                    onClick={() =>
                      openConversation(
                        conversation.id
                      )
                    }
                  >
                    <MessageSquare
                      size={17}
                    />

                    <span>
                      {conversation.title}
                    </span>
                  </button>

                  <button
                    type="button"
                    className="chat-delete-button"
                    onClick={() =>
                      setConversationToDelete(
                        conversation
                      )
                    }
                    title="Delete conversation"
                    aria-label={`Delete ${conversation.title}`}
                  >
                    <Trash2
                      size={15}
                    />
                  </button>
                </div>
              )
            )
          )}
        </div>
      </aside>

      {/* =====================================================
          MAIN CHAT
      ===================================================== */}

      <main className="chat-main">

        {/* ===================================================
            CHAT HEADER
        =================================================== */}

        <header className="chat-header">

          {/* NEW BACK BUTTON */}

          <button
            type="button"
            className="chat-back-button"
            onClick={() => navigate(-1)}
            title="Go back"
            aria-label="Go back"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <span className="chat-header-label">
              AI Knowledge Chat
            </span>

            <h2>
              Ask questions about your documents
            </h2>
          </div>

          <div className="chat-header-actions">

            {/* =================================================
                DOCUMENT CONTEXT SELECTOR
            ================================================= */}

            <div
              className="chat-document-context"
              ref={documentSelectorRef}
            >
              <button
                type="button"
                className="chat-document-selector-button"
                onClick={() =>
                  setIsDocumentSelectorOpen(
                    (current) =>
                      !current
                  )
                }
                aria-expanded={
                  isDocumentSelectorOpen
                }
                aria-haspopup="listbox"
                title="Choose document context"
              >
                <Files size={17} />

                <span className="chat-document-selector-label">
                  {getDocumentScopeLabel()}
                </span>

                {selectedDocumentIds.length >
                  0 && (
                    <span className="chat-document-selector-count">
                      {
                        selectedDocumentIds.length
                      }
                    </span>
                  )}

                <ChevronDown
                  size={15}
                />
              </button>

              {isDocumentSelectorOpen && (
                <div
                  className="chat-document-selector-menu"
                  role="listbox"
                  aria-label="Document context"
                >
                  <div className="chat-document-selector-header">
                    <div className="chat-document-selector-heading">
                      <strong>
                        Knowledge scope
                      </strong>

                      <span>
                        Choose which documents
                        the AI can use.
                      </span>
                    </div>

                    {selectedDocumentIds.length >
                      0 && (
                      <button
                        type="button"
                        className="chat-document-clear-button"
                        onClick={
                          clearDocumentSelection
                        }
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="chat-document-options">

                    {/* ALL DOCUMENTS */}

                    <button
                      type="button"
                      className={`chat-document-all-option ${
                        selectedDocumentIds.length ===
                        0
                          ? "selected"
                          : ""
                      }`}
                      onClick={
                        selectAllDocuments
                      }
                      role="option"
                      aria-selected={
                        selectedDocumentIds.length ===
                        0
                      }
                    >
                      <Files
                        size={16}
                      />

                      <span>
                        All documents
                      </span>

                      {selectedDocumentIds.length ===
                        0 && (
                        <Check
                          size={15}
                        />
                      )}
                    </button>

                    {/* DOCUMENT LIST */}

                    {isLoadingDocuments ? (
                      <div className="chat-document-loading">
                        Loading documents...
                      </div>
                    ) : documents.length ===
                      0 ? (
                      <div className="chat-document-empty">
                        <FileText
                          size={22}
                        />

                        <strong>
                          No documents available
                        </strong>

                        <span>
                          Upload documents first
                          to use controlled
                          knowledge retrieval.
                        </span>
                      </div>
                    ) : (
                      documents.map(
                        (document) => {
                          const documentId =
                            Number(
                              document.id
                            );

                          const isSelected =
                            selectedDocumentIds.includes(
                              documentId
                            );

                          return (
                            <button
                              key={
                                document.id
                              }
                              type="button"
                              className={`chat-document-option ${
                                isSelected
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() =>
                                toggleDocumentSelection(
                                  documentId
                                )
                              }
                              role="option"
                              aria-selected={
                                isSelected
                              }
                              title={
                                document.filename
                              }
                            >
                              <span className="chat-document-option-icon">
                                <FileText
                                  size={16}
                                />
                              </span>

                              <span className="chat-document-option-content">
                                <span className="chat-document-option-name">
                                  {
                                    document.filename
                                  }
                                </span>

                                <span className="chat-document-option-meta">
                                  Document #
                                  {
                                    document.id
                                  }

                                  {document.status && (
                                    <>
                                      {" "}
                                      ·{" "}
                                      {
                                        document.status
                                      }
                                    </>
                                  )}
                                </span>
                              </span>

                              <span className="chat-document-option-check">
                                {isSelected && (
                                  <Check
                                    size={13}
                                  />
                                )}
                              </span>
                            </button>
                          );
                        }
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                THEME TOGGLE
            ================================================= */}

            <button
              type="button"
              className="chat-theme-toggle"
              onClick={toggleTheme}
              title={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              {theme === "dark" ? (
                <Sun size={17} />
              ) : (
                <Moon size={17} />
              )}
            </button>

            {/* =================================================
                NEW CHAT
            ================================================= */}

            <button
              type="button"
              className="chat-header-new"
              onClick={
                startNewConversation
              }
            >
              <Plus size={17} />
              New Chat
            </button>
          </div>
        </header>

        {/* ===================================================
            MESSAGE AREA
        =================================================== */}

        <section className="chat-messages">
          {isLoadingMessages ? (
            <div className="chat-loading">
              Loading conversation...
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <Bot size={30} />
              </div>

              <h3>
                Ask your knowledge base
              </h3>

              <p>
                Ask a question about your
                uploaded documents. The
                assistant will retrieve relevant
                information before generating
                an answer.
              </p>

              <p className="chat-context-description">
                <Files size={14} />

                {selectedDocumentIds.length >
                0
                  ? `Using ${selectedDocumentIds.length} selected ${
                      selectedDocumentIds.length ===
                      1
                        ? "document"
                        : "documents"
                    } as the knowledge scope.`
                  : "Using all uploaded documents as the knowledge scope."}
              </p>
            </div>
          ) : (
            <>
              {messages.map(
                (message) => (
                  <div
                    key={message.id}
                    className={`chat-message ${
                      message.role ===
                      "user"
                        ? "user"
                        : "assistant"
                    }`}
                  >
                    <div className="chat-message-avatar">
                      {message.role ===
                      "user" ? (
                        <User size={17} />
                      ) : (
                        <Bot size={17} />
                      )}
                    </div>

                    <div className="chat-message-content">
                      <div className="chat-message-role">
                        {message.role ===
                        "user"
                          ? "You"
                          : "Assistant"}
                      </div>

                      <div className="chat-message-text">
                        {message.content}
                      </div>

                      {/* PERSISTED RAG SOURCES */}

                      {message.role ===
                        "assistant" &&
                        message.sources
                          ?.length > 0 && (
                          <div className="chat-sources">
                            <div className="chat-sources-title">
                              <FileText
                                size={14}
                              />
                              Sources
                            </div>

                            <div className="chat-sources-list">
                              {message.sources.map(
                                (
                                  source,
                                  index
                                ) => (
                                  <SourceCard
                                    key={
                                      source.chunk_id ??
                                      `${message.id}-source-${index}`
                                    }
                                    source={
                                      source
                                    }
                                    index={
                                      index
                                    }
                                  />
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>
                )
              )}

              {/* THINKING INDICATOR */}

              {isSending && (
                <div className="chat-message assistant">
                  <div className="chat-message-avatar">
                    <Bot size={17} />
                  </div>

                  <div className="chat-message-content">
                    <div className="chat-message-role">
                      Assistant
                    </div>

                    <div className="chat-thinking">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </section>

        {/* ===================================================
            INPUT
        =================================================== */}

        <form
          className="chat-input-area"
          onSubmit={handleSubmit}
        >
          <div className="chat-input-wrapper">
            <textarea
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value
                )
              }
              placeholder={
                selectedDocumentIds.length >
                0
                  ? "Ask something about the selected documents..."
                  : "Ask something about your documents..."
              }
              rows={1}
              disabled={isSending}
              onKeyDown={(event) => {
                if (
                  event.key ===
                    "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSubmit(event);
                }
              }}
            />

            <button
              type="submit"
              className="chat-send-button"
              disabled={
                isSending ||
                !question.trim()
              }
              title="Send message"
              aria-label="Send message"
            >
              <Send size={18} />
            </button>
          </div>

          <p className="chat-input-hint">
            {selectedDocumentIds.length >
            0
              ? `Searching ${
                  selectedDocumentIds.length
                } selected ${
                  selectedDocumentIds.length ===
                  1
                    ? "document"
                    : "documents"
                } · Press Enter to send · Shift + Enter for a new line`
              : "Searching all documents · Press Enter to send · Shift + Enter for a new line"}
          </p>
        </form>
      </main>

      {/* =====================================================
          DELETE CONVERSATION MODAL
      ===================================================== */}

      <Modal
        isOpen={Boolean(
          conversationToDelete
        )}
        onClose={() =>
          setConversationToDelete(null)
        }
        title="Delete conversation?"
        size="small"
      >
        <div className="chat-delete-confirmation">
          <p>
            Are you sure you want to delete{" "}
            <strong>
              {
                conversationToDelete?.title ||
                "this conversation"
              }
            </strong>
            ?
          </p>

          <span>
            This action cannot be undone.
          </span>

          <div className="chat-delete-confirmation-actions">
            <Button
              type="button"
              variant="secondary"
              size="medium"
              onClick={() =>
                setConversationToDelete(
                  null
                )
              }
            >
              Cancel
            </Button>

            <Button
              type="button"
              size="medium"
              onClick={async () => {
                if (
                  !conversationToDelete
                ) {
                  return;
                }

                const id =
                  conversationToDelete.id;

                setConversationToDelete(
                  null
                );

                await handleDeleteConversation(
                  id
                );
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Chat;
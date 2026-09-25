import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  const addToast = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = Date.now() + Math.random();

      setToasts((current) => [
        ...current,
        {
          id,
          message,
          type,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message, duration = 4000) =>
      addToast(message, "success", duration),
    [addToast]
  );

  const error = useCallback(
    (message, duration = 4000) =>
      addToast(message, "error", duration),
    [addToast]
  );

  const warning = useCallback(
    (message, duration = 4000) =>
      addToast(message, "warning", duration),
    [addToast]
  );

  const info = useCallback(
    (message, duration = 4000) =>
      addToast(message, "info", duration),
    [addToast]
  );

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        addToast,
        success,
        error,
        warning,
        info,
        removeToast,
        clearToasts,
      }}
    >
      {children}

      <div
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 999999,
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            style={{
              minWidth: "320px",
              maxWidth: "420px",
              padding: "16px 18px",
              backgroundColor:
                toast.type === "success"
                  ? "#16a34a"
                  : toast.type === "error"
                  ? "#dc2626"
                  : toast.type === "warning"
                  ? "#d97706"
                  : "#2563eb",
              color: "#ffffff",
              borderRadius: "10px",
              boxShadow:
                "0 10px 30px rgba(0, 0, 0, 0.35)",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              pointerEvents: "auto",
            }}
          >
            <span>{toast.message}</span>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
              style={{
                border: "none",
                background: "transparent",
                color: "#ffffff",
                fontSize: "22px",
                cursor: "pointer",
                padding: "0",
                lineHeight: "1",
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider."
    );
  }

  return context;
}
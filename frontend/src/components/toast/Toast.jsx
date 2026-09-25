import { useEffect } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from "lucide-react";
import "./Toast.css";

const toastConfig = {
  success: {
    icon: CheckCircle2,
    title: "Success",
  },
  error: {
    icon: AlertCircle,
    title: "Error",
  },
  warning: {
    icon: AlertTriangle,
    title: "Warning",
  },
  info: {
    icon: Info,
    title: "Information",
  },
};

function Toast({
  type = "info",
  message,
  title,
  duration = 4000,
  onClose,
}) {
  const config = toastConfig[type] || toastConfig.info;
  const Icon = config.icon;

  useEffect(() => {
    if (!duration) return;

    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={`toast toast-${type}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-icon">
        <Icon size={20} />
      </div>

      <div className="toast-content">
        <p className="toast-title">
          {title || config.title}
        </p>

        <p className="toast-message">
          {message}
        </p>
      </div>

      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={17} />
      </button>
    </div>
  );
}

export default Toast;
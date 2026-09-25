import { Loader2 } from "lucide-react";
import "./Button.css";

function Button({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      className={`app-button app-button-${variant} app-button-${size} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <>
          <Loader2 className="button-spinner" size={18} />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

export default Button;
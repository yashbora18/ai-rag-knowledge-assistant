import { Loader2 } from "lucide-react";
import "./Spinner.css";

function Spinner({ size = "medium", label = "Loading..." }) {
  return (
    <div className={`spinner-wrapper spinner-${size}`}>
      <Loader2 className="spinner-icon" aria-hidden="true" />

      {label && (
        <span className="spinner-label">
          {label}
        </span>
      )}
    </div>
  );
}

export default Spinner;
import { FileSearch } from "lucide-react";
import "./EmptyState.css";

function EmptyState({
  icon: Icon = FileSearch,
  title = "Nothing here yet",
  description = "There is no data to display right now.",
  action,
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Icon size={28} />
      </div>

      <h3 className="empty-state-title">{title}</h3>

      <p className="empty-state-description">{description}</p>

      {action && <div className="empty-state-action">{action}</div>}
    </div>
  );
}

export default EmptyState;
import { useState } from "react";

import {
  BarChart3,
  Bot,
  ChevronDown,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings,
  Sparkles,
  User,
  X,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";

import "./Sidebar.css";

function Sidebar({ isOpen = false }) {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const mainNavigation = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Documents",
      path: "/documents",
      icon: FileText,
    },
    {
      label: "Knowledge Base",
      path: "/knowledge",
      icon: FolderOpen,
    },
    {
      label: "AI Chat",
      path: "/chat",
      icon: MessageSquareText,
      badge: "AI",
    },
  ];

  const workspaceNavigation = [
    {
      label: "Analytics",
      path: "/analytics",
      icon: BarChart3,
    },
    {
      label: "Profile",
      path: "/profile",
      icon: User,
    },
    {
      label: "Settings",
      path: "/settings",
      icon: Settings,
    },
  ];

  const getInitials = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
      return "U";
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);

    logout();

    success("You have been logged out successfully.");

    navigate("/login", { replace: true });
  };

  return (
    <>
      <aside
        className={`sidebar ${
          isOpen ? "sidebar--open" : ""
        }`}
      >
        {/* Workspace */}
<button
  type="button"
  className="sidebar__workspace"
  onClick={() => navigate("/knowledge")}
  title="Open Knowledge Base"
>
  <div className="sidebar__workspace-icon">
    <Bot size={17} />
  </div>

  <div className="sidebar__workspace-info">
    <div className="sidebar__workspace-label">
      Workspace
    </div>

    <div className="sidebar__workspace-name">
      My Knowledge Base
    </div>
  </div>

  <ChevronDown
    size={15}
    className="sidebar__workspace-chevron"
  />
</button>

        {/* Main navigation */}
        <section className="sidebar__section">
          <div className="sidebar__section-label">
            Workspace
          </div>

          <nav className="sidebar__nav">
            {mainNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar__link ${
                      isActive
                        ? "sidebar__link--active"
                        : ""
                    }`
                  }
                >
                  <Icon
                    className="sidebar__link-icon"
                    size={18}
                  />

                  <span className="sidebar__link-label">
                    {item.label}
                  </span>

                  {item.badge && (
                    <span className="sidebar__link-badge">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </section>

        {/* Management navigation */}
        <section className="sidebar__section">
          <div className="sidebar__section-label">
            Manage
          </div>

          <nav className="sidebar__nav">
            {workspaceNavigation.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `sidebar__link ${
                      isActive
                        ? "sidebar__link--active"
                        : ""
                    }`
                  }
                >
                  <Icon
                    className="sidebar__link-icon"
                    size={18}
                  />

                  <span className="sidebar__link-label">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </section>

        {/* Bottom area */}
        <div className="sidebar__bottom">
          <div className="sidebar__upgrade">
            <div className="sidebar__upgrade-icon">
              <Sparkles size={15} />
            </div>

            <div className="sidebar__upgrade-title">
              Unlock more AI power
            </div>

            <p className="sidebar__upgrade-text">
              Get higher limits and advanced AI
              capabilities for your knowledge workspace.
            </p>

            <button
  type="button"
  className="sidebar__upgrade-button"
  onClick={() => navigate("/settings")}
  title="Explore plans"
>
  Explore plans
</button>
          </div>

          {/* Authenticated user */}
          <div className="sidebar__user">
            <button
              type="button"
              className="sidebar__user-profile"
              onClick={() => navigate("/profile")}
              title="Open Profile"
            >
              <div className="sidebar__avatar">
                {getInitials(user?.name)}
              </div>

              <div className="sidebar__user-info">
                <div className="sidebar__user-name">
                  {user?.name || "User"}
                </div>

                <div className="sidebar__user-email">
                  {user?.email || "No email"}
                </div>
              </div>
            </button>

            <button
              type="button"
              className="sidebar__user-menu"
              aria-label="Logout"
              onClick={handleLogoutClick}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Logout confirmation modal */}
      {showLogoutModal && (
        <div
          className="logout-modal-overlay"
          onClick={handleCancelLogout}
        >
          <div
            className="logout-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="logout-modal__close"
              onClick={handleCancelLogout}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="logout-modal__icon">
              <LogOut size={22} />
            </div>

            <h2 id="logout-modal-title">
              Logout?
            </h2>

            <p>
              Are you sure you want to logout from your
              RAGAI account?
            </p>

            <div className="logout-modal__actions">
              <button
                type="button"
                className="logout-modal__cancel"
                onClick={handleCancelLogout}
              >
                Cancel
              </button>

              <button
                type="button"
                className="logout-modal__confirm"
                onClick={handleConfirmLogout}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
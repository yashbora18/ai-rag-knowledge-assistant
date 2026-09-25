import {
  Bell,
  BrainCircuit,
  CheckCircle2,
  Menu,
  MessageSquareText,
  Moon,
  Sun,
  X,
} from "lucide-react";

import { Link, NavLink } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import { useTheme } from "../../../hooks/useTheme";
import { useAuth } from "../../../context/AuthContext";

import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead as markNotificationAsReadApi,
} from "../../../services/notificationService";

import "./Navbar.css";

function formatNotificationTime(createdAt) {
  if (!createdAt) {
    return "";
  }

  const createdDate = new Date(createdAt);

  if (Number.isNaN(createdDate.getTime())) {
    return "";
  }

  const now = new Date();

  const difference = Math.max(
    0,
    now.getTime() - createdDate.getTime()
  );

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return createdDate.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year:
      createdDate.getFullYear() !== now.getFullYear()
        ? "numeric"
        : undefined,
  });
}

function normalizeNotification(notification) {
  return {
    id: notification.id,
    type: notification.type || "info",
    title: notification.title || "Notification",
    message: notification.message || "",
    read: Boolean(notification.is_read),
    time: formatNotificationTime(notification.created_at),
    createdAt: notification.created_at,
  };
}

function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const {
    isAuthenticated,
    isLoading: isAuthLoading,
  } = useAuth();

  const notificationWrapperRef = useRef(null);
  const mobileNotificationsRef = useRef(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [notifications, setNotifications] = useState([]);
  const [isLoadingNotifications, setIsLoadingNotifications] =
    useState(false);

  const [notificationActionId, setNotificationActionId] =
    useState(null);

  const [isMarkingAllRead, setIsMarkingAllRead] =
    useState(false);

  /*
   * =========================================================
   * LOAD REAL NOTIFICATIONS
   * =========================================================
   */

  const loadNotifications = async () => {
    if (isAuthLoading || !isAuthenticated) {
      setNotifications([]);
      setIsLoadingNotifications(false);
      return;
    }

    try {
      setIsLoadingNotifications(true);

      const data = await getNotifications();

      const normalized = Array.isArray(data)
        ? data.map(normalizeNotification)
        : [];

      setNotifications(normalized);
    } catch (error) {
      console.error(
        "Failed to load notifications:",
        error
      );

      setNotifications([]);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  /*
   * =========================================================
   * INITIAL LOAD
   * =========================================================
   */

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      setNotifications([]);
      setIsLoadingNotifications(false);
      return;
    }

    loadNotifications();
  }, [isAuthenticated, isAuthLoading]);

  /*
   * =========================================================
   * REFRESH REAL NOTIFICATIONS
   * =========================================================
   */

  useEffect(() => {
    if (isAuthLoading || !isAuthenticated) {
      return undefined;
    }

    const refreshInterval = window.setInterval(() => {
      loadNotifications();
    }, 30000);

    return () => {
      window.clearInterval(refreshInterval);
    };
  }, [isAuthenticated, isAuthLoading]);

  /*
   * =========================================================
   * CLOSE NOTIFICATIONS ON OUTSIDE CLICK / ESCAPE
   * =========================================================
   */

  useEffect(() => {
    if (!notificationsOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      const target = event.target;

      const clickedDesktopNotification =
        notificationWrapperRef.current?.contains(target);

      const clickedMobileNotification =
        mobileNotificationsRef.current?.contains(target);

      const clickedNotificationButton =
        target.closest?.(".navbar__notification");

      if (
        !clickedDesktopNotification &&
        !clickedMobileNotification &&
        !clickedNotificationButton
      ) {
        setNotificationsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [notificationsOpen]);

  /*
   * =========================================================
   * CLOSE MOBILE MENU
   * =========================================================
   */

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  /*
   * =========================================================
   * TOGGLE NOTIFICATIONS
   * =========================================================
   */

  const toggleNotifications = async () => {
    if (!isAuthenticated || isAuthLoading) {
      return;
    }

    if (notificationsOpen) {
      setNotificationsOpen(false);
      return;
    }

    await loadNotifications();
    setNotificationsOpen(true);
  };

  /*
   * =========================================================
   * UNREAD COUNT
   * =========================================================
   */

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  /*
   * =========================================================
   * MARK ALL AS READ
   * =========================================================
   */

  const markAllAsRead = async () => {
    if (
      !isAuthenticated ||
      unreadCount === 0 ||
      isMarkingAllRead
    ) {
      return;
    }

    try {
      setIsMarkingAllRead(true);

      await markAllNotificationsAsRead();

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    } catch (error) {
      console.error(
        "Failed to mark all notifications as read:",
        error
      );
    } finally {
      setIsMarkingAllRead(false);
    }
  };

  /*
   * =========================================================
   * MARK ONE NOTIFICATION AS READ
   * =========================================================
   */

  const markNotificationAsRead = async (
    notificationId
  ) => {
    if (!isAuthenticated) {
      return;
    }

    const notification = notifications.find(
      (item) => item.id === notificationId
    );

    if (!notification || notification.read) {
      return;
    }

    try {
      setNotificationActionId(notificationId);

      await markNotificationAsReadApi(notificationId);

      setNotifications((current) =>
        current.map((item) =>
          item.id === notificationId
            ? {
                ...item,
                read: true,
              }
            : item
        )
      );
    } catch (error) {
      console.error(
        "Failed to mark notification as read:",
        error
      );
    } finally {
      setNotificationActionId(null);
    }
  };

  /*
   * =========================================================
   * NOTIFICATION ICON
   * =========================================================
   */

  const getNotificationIcon = (type) => {
    switch (type) {
      case "document":
      case "success":
        return <CheckCircle2 size={19} />;

      case "error":
        return <X size={19} />;

      case "warning":
        return <Bell size={19} />;

      case "ai":
      case "rag":
      case "info":
      default:
        return <MessageSquareText size={19} />;
    }
  };

  /*
   * =========================================================
   * NOTIFICATION ITEM
   * =========================================================
   */

  const renderNotificationItem = (notification) => (
    <button
      key={notification.id}
      type="button"
      className={`navbar__notification-item ${
        notification.read
          ? "navbar__notification-item--read"
          : ""
      }`}
      onClick={() =>
        markNotificationAsRead(notification.id)
      }
      disabled={
        notificationActionId === notification.id
      }
      aria-label={
        notification.read
          ? notification.title
          : `Mark ${notification.title} as read`
      }
    >
      <div
        className={`navbar__notification-icon navbar__notification-icon--${notification.type}`}
      >
        {getNotificationIcon(notification.type)}
      </div>

      <div className="navbar__notification-content">
        <strong>{notification.title}</strong>

        <p className="navbar__notification-message">
          {notification.message}
        </p>

        <span>{notification.time}</span>
      </div>

      {!notification.read && (
        <span className="navbar__notification-unread-dot" />
      )}
    </button>
  );

  /*
   * =========================================================
   * NOTIFICATION LIST
   * =========================================================
   */

  const renderNotificationList = () => {
    if (isLoadingNotifications) {
      return (
        <div className="navbar__notification-empty">
          <Bell size={24} />

          <strong>
            Loading notifications...
          </strong>

          <span>
            Checking for new activity.
          </span>
        </div>
      );
    }

    if (notifications.length === 0) {
      return (
        <div className="navbar__notification-empty">
          <Bell size={24} />

          <strong>
            No notifications
          </strong>

          <span>
            You're all caught up.
          </span>
        </div>
      );
    }

    return notifications.map(renderNotificationItem);
  };

  return (
    <header className="navbar">
      <div className="navbar__container">

        {/* LOGO */}

        <Link
          to="/dashboard"
          className="navbar__brand"
          onClick={closeMobileMenu}
        >
          <span className="navbar__logo">
            <BrainCircuit
              size={22}
              strokeWidth={2.2}
            />
          </span>

          <span className="navbar__brand-text">
            RAG<span>AI</span>
          </span>
        </Link>

        {/* DESKTOP NAVIGATION */}

        <nav className="navbar__links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/documents"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            Documents
          </NavLink>

          <NavLink
            to="/chat"
            className={({ isActive }) =>
              isActive ? "active" : ""
            }
          >
            AI Chat
          </NavLink>
        </nav>

        {/* DESKTOP ACTIONS */}

        <div className="navbar__actions">

          {/* Theme */}

          <button
            type="button"
            className="navbar__theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${
              theme === "light"
                ? "dark"
                : "light"
            } mode`}
            title={`Switch to ${
              theme === "light"
                ? "dark"
                : "light"
            } mode`}
          >
            {theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>

          {/* Notifications */}

          {isAuthenticated && (
            <div
              ref={notificationWrapperRef}
              className="navbar__notification-wrapper"
            >
              <button
                type="button"
                className={`navbar__notification ${
                  notificationsOpen
                    ? "navbar__notification--active"
                    : ""
                }`}
                onClick={toggleNotifications}
                aria-label={`Notifications${
                  unreadCount > 0
                    ? `, ${unreadCount} unread`
                    : ""
                }`}
                aria-expanded={notificationsOpen}
                title="Notifications"
              >
                <Bell size={19} />

                {unreadCount > 0 && (
                  <span className="navbar__notification-badge">
                    {unreadCount > 9
                      ? "9+"
                      : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="navbar__notification-panel">
                  <div className="navbar__notification-header">
                    <div>
                      <span className="navbar__notification-label">
                        ACTIVITY
                      </span>

                      <h3>
                        Notifications
                      </h3>
                    </div>

                    {unreadCount > 0 && (
                      <span className="navbar__notification-count">
                        {unreadCount}
                      </span>
                    )}
                  </div>

                  <div className="navbar__notification-list">
                    {renderNotificationList()}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="navbar__notification-clear"
                      onClick={markAllAsRead}
                      disabled={isMarkingAllRead}
                    >
                      {isMarkingAllRead
                        ? "Marking as read..."
                        : "Mark all as read"}
                    </button>
                  )}

                  {unreadCount === 0 &&
                    notifications.length > 0 && (
                      <div className="navbar__notification-read-status">
                        <CheckCircle2 size={17} />

                        <span>
                          All notifications are read
                        </span>
                      </div>
                    )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* MOBILE ACTIONS */}

        <div className="navbar__mobile-actions">

          {/* Mobile Theme */}

          <button
            type="button"
            className="navbar__theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${
              theme === "light"
                ? "dark"
                : "light"
            } mode`}
          >
            {theme === "light" ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>

          {/* Mobile Notifications */}

          {isAuthenticated && (
            <button
              type="button"
              className={`navbar__notification ${
                notificationsOpen
                  ? "navbar__notification--active"
                  : ""
              }`}
              onClick={toggleNotifications}
              aria-label={`Notifications${
                unreadCount > 0
                  ? `, ${unreadCount} unread`
                  : ""
              }`}
              aria-expanded={notificationsOpen}
              title="Notifications"
            >
              <Bell size={18} />

              {unreadCount > 0 && (
                <span className="navbar__notification-badge">
                  {unreadCount > 9
                    ? "9+"
                    : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* Mobile Menu */}

          <button
            type="button"
            className="navbar__menu-button"
            onClick={() =>
              setMobileOpen((current) => !current)
            }
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          MOBILE MENU
      ===================================================== */}

      <div
        className={`navbar__mobile-menu ${
          mobileOpen
            ? "navbar__mobile-menu--open"
            : ""
        }`}
      >
        <nav className="navbar__mobile-links">
          <NavLink
            to="/dashboard"
            onClick={closeMobileMenu}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/documents"
            onClick={closeMobileMenu}
          >
            Documents
          </NavLink>

          <NavLink
            to="/chat"
            onClick={closeMobileMenu}
          >
            AI Chat
          </NavLink>

          <NavLink
            to="/analytics"
            onClick={closeMobileMenu}
          >
            Analytics
          </NavLink>

          <NavLink
            to="/profile"
            onClick={closeMobileMenu}
          >
            Profile
          </NavLink>

          <NavLink
            to="/settings"
            onClick={closeMobileMenu}
          >
            Settings
          </NavLink>
        </nav>
      </div>

      {/* =====================================================
          MOBILE NOTIFICATIONS

          IMPORTANT:
          This is intentionally OUTSIDE the mobile menu so
          the notification popup works independently from
          the hamburger menu.
      ===================================================== */}

      {isAuthenticated && notificationsOpen && (
        <div
          ref={mobileNotificationsRef}
          className="navbar__notification-panel navbar__mobile-notifications"
        >
          <div className="navbar__notification-header">
            <div>
              <span className="navbar__notification-label">
                ACTIVITY
              </span>

              <h3>
                Notifications
              </h3>
            </div>

            {unreadCount > 0 && (
              <span className="navbar__notification-count">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="navbar__notification-list">
            {renderNotificationList()}
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              className="navbar__notification-clear"
              onClick={markAllAsRead}
              disabled={isMarkingAllRead}
            >
              {isMarkingAllRead
                ? "Marking as read..."
                : "Mark all as read"}
            </button>
          )}

          {unreadCount === 0 &&
            notifications.length > 0 && (
              <div className="navbar__notification-read-status">
                <CheckCircle2 size={17} />

                <span>
                  All notifications are read
                </span>
              </div>
            )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
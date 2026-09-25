import {
  CheckCircle2,
  Moon,
  ShieldCheck,
  Sun,
  User,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import Navbar from "../../components/layout/Navbar/Navbar";
import Sidebar from "../../components/layout/Sidebar/Sidebar";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";

import "./Settings.css";

function Settings() {
  const navigate = useNavigate();

  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const userName =
    user?.name ||
    user?.full_name ||
    user?.username ||
    "User";

  const userEmail =
    user?.email ||
    "No email available";

  const isDark = theme === "dark";

  const isActive =
    user?.is_active !== false &&
    user?.active !== false;

  const isAuthenticated = Boolean(user);

  return (
    <div className="settings-page">
      <Navbar />

      <div className="settings-page__layout">
        <Sidebar />

        <main className="settings-page__main">
          <div className="settings-page__container">

            {/* Header */}
            <header className="settings-page__header">
              <div>
                <span className="settings-page__eyebrow">
                  PREFERENCES
                </span>

                <h1 className="settings-page__title">
                  Settings
                </h1>

                <p className="settings-page__subtitle">
                  Manage your account preferences and application
                  experience.
                </p>
              </div>
            </header>

            {/* Account */}
            <section className="settings-page__section">
              <div className="settings-page__section-header">
                <div className="settings-page__section-icon">
                  <User size={19} />
                </div>

                <div>
                  <h2>Account</h2>
                  <p>
                    Your authenticated account information.
                  </p>
                </div>
              </div>

              <div className="settings-page__account-card">
                <div className="settings-page__account-item">
                  <span className="settings-page__label">
                    Name
                  </span>

                  <strong>{userName}</strong>
                </div>

                <div className="settings-page__account-item">
                  <span className="settings-page__label">
                    Email
                  </span>

                  <strong>{userEmail}</strong>
                </div>

                <div className="settings-page__account-item">
                  <span className="settings-page__label">
                    Status
                  </span>

                  <div className="settings-page__status">
                    <span
                      className="settings-page__status-dot"
                      style={{
                        background: isActive
                          ? "#43e6b1"
                          : "#ef4444",
                        boxShadow: isActive
                          ? "0 0 0 4px rgba(67, 230, 177, 0.08), 0 0 12px rgba(67, 230, 177, 0.35)"
                          : "0 0 0 4px rgba(239, 68, 68, 0.08), 0 0 12px rgba(239, 68, 68, 0.25)",
                      }}
                    />

                    <strong>
                      {isActive ? "Active" : "Inactive"}
                    </strong>
                  </div>
                </div>
              </div>
            </section>

            {/* Appearance */}
            <section className="settings-page__section">
              <div className="settings-page__section-header">
                <div className="settings-page__section-icon">
                  {isDark ? (
                    <Moon size={19} />
                  ) : (
                    <Sun size={19} />
                  )}
                </div>

                <div>
                  <h2>Appearance</h2>
                  <p>
                    Customize how RAGAI looks on your device.
                  </p>
                </div>
              </div>

              <div className="settings-page__card">
                <div className="settings-page__setting-row">
                  <div className="settings-page__setting-left">
                    <div className="settings-page__setting-icon">
                      {isDark ? (
                        <Moon size={18} />
                      ) : (
                        <Sun size={18} />
                      )}
                    </div>

                    <div>
                      <h3>Theme</h3>

                      <p>
                        Currently using{" "}
                        {isDark
                          ? "Dark Mode"
                          : "Light Mode"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="settings-page__theme-button"
                    onClick={toggleTheme}
                    aria-label={
                      isDark
                        ? "Switch to light mode"
                        : "Switch to dark mode"
                    }
                  >
                    {isDark ? (
                      <>
                        <Sun size={17} />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon size={17} />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </section>

            {/* Security */}
            <section className="settings-page__section">
              <div className="settings-page__section-header">
                <div className="settings-page__section-icon">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <h2>Security</h2>
                  <p>
                    Your account is protected by authenticated
                    access.
                  </p>
                </div>
              </div>

              <div className="settings-page__card">
                <div className="settings-page__security-row">
                  <div className="settings-page__setting-icon">
                    <ShieldCheck size={18} />
                  </div>

                  <div className="settings-page__security-content">
                    <h3>Authenticated account</h3>

                    <p>
                      Your session is protected using secure
                      authentication.
                    </p>
                  </div>

                  <div className="settings-page__verified">
                    <CheckCircle2 size={17} />

                    <span>
                      {isAuthenticated
                        ? "Authenticated"
                        : "Not authenticated"}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Quick Links */}
            <section className="settings-page__section settings-page__section--last">
              <div className="settings-page__quick-links">
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="settings-page__quick-link"
                >
                  <User size={17} />
                  <span>View Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="settings-page__quick-link"
                >
                  <CheckCircle2 size={17} />
                  <span>Back to Dashboard</span>
                </button>
              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
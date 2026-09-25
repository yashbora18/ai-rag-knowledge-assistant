import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  ShieldCheck,
  User,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar/Navbar";
import Sidebar from "../../components/layout/Sidebar/Sidebar";

import { useAuth } from "../../context/AuthContext";

import "./Profile.css";

function formatDate(dateString, fallback = "Not available") {
  if (!dateString) {
    return fallback;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateString, fallback = "Not available") {
  if (!dateString) {
    return fallback;
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getInitials(name = "") {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) {
    return "U";
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

function getDisplayName(user) {
  return (
    user?.full_name ||
    user?.name ||
    user?.username ||
    user?.email?.split("@")[0] ||
    "User"
  );
}

function getAccountStatus(user) {
  if (user?.is_active === false || user?.active === false) {
    return "Inactive";
  }

  return "Active";
}

function Profile() {
  const { user } = useAuth();

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);

  const email =
    user?.email ||
    "Email unavailable";

  const userId =
    user?.id ??
    user?.user_id ??
    "—";

  const accountStatus = getAccountStatus(user);

  const createdAt =
    user?.created_at ||
    user?.createdAt ||
    null;

  const updatedAt =
    user?.updated_at ||
    user?.updatedAt ||
    null;

  return (
    <div className="profile-layout">
      <Navbar />

      <div className="profile-shell">
        <Sidebar />

        <main className="profile-main">
          <div className="profile-content">

            {/* =====================================================
                PAGE HEADER
            ===================================================== */}

            <header className="profile-page-header">
              <div>
                <p className="profile-eyebrow">
                  Account
                </p>

                <h1>
                  Profile
                </h1>

                <p className="profile-page-description">
                  Manage and view your account information.
                </p>
              </div>
            </header>

            {/* =====================================================
                ACCOUNT HERO
            ===================================================== */}

            <section className="profile-hero-card">
              <div className="profile-avatar">
                {initials}
              </div>

              <div className="profile-hero-content">
                <p className="profile-eyebrow">
                  Account
                </p>

                <h2>
                  {displayName}
                </h2>

                <p className="profile-email">
                  <Mail size={16} />
                  <span>
                    {email}
                  </span>
                </p>
              </div>

              <div
                className={`profile-status ${
                  accountStatus === "Active"
                    ? "profile-status-active"
                    : "profile-status-inactive"
                }`}
              >
                <span className="profile-status-dot" />

                <span>
                  {accountStatus} account
                </span>
              </div>
            </section>

            {/* =====================================================
                PERSONAL DETAILS
            ===================================================== */}

            <section className="profile-section">
              <div className="profile-section-heading">
                <div>
                  <p className="profile-eyebrow">
                    Account information
                  </p>

                  <h2>
                    Personal details
                  </h2>

                  <p>
                    Information associated with your authenticated account.
                  </p>
                </div>
              </div>

              <div className="profile-details-grid">

                {/* USER ID */}

                <article className="profile-detail-card">
                  <div className="profile-detail-icon">
                    <User size={20} />
                  </div>

                  <div className="profile-detail-content">
                    <span>
                      User ID
                    </span>

                    <strong>
                      #{userId}
                    </strong>
                  </div>
                </article>

                {/* EMAIL */}

                <article className="profile-detail-card">
                  <div className="profile-detail-icon">
                    <Mail size={20} />
                  </div>

                  <div className="profile-detail-content">
                    <span>
                      Email address
                    </span>

                    <strong>
                      {email}
                    </strong>
                  </div>
                </article>

                {/* ACCOUNT STATUS */}

                <article className="profile-detail-card">
                  <div className="profile-detail-icon">
                    <ShieldCheck size={20} />
                  </div>

                  <div className="profile-detail-content">
                    <span>
                      Account status
                    </span>

                    <strong>
                      {accountStatus}
                    </strong>
                  </div>
                </article>

                {/* MEMBER SINCE */}

                <article className="profile-detail-card">
                  <div className="profile-detail-icon">
                    <CalendarDays size={20} />
                  </div>

                  <div className="profile-detail-content">
                    <span>
                      Member since
                    </span>

                    <strong>
                      {formatDate(createdAt)}
                    </strong>
                  </div>
                </article>

              </div>
            </section>

            {/* =====================================================
                ACCOUNT ACTIVITY
            ===================================================== */}

            <section className="profile-section">
              <div className="profile-section-heading">
                <div>
                  <p className="profile-eyebrow">
                    Account activity
                  </p>

                  <h2>
                    Account timeline
                  </h2>

                  <p>
                    Important timestamps for your account.
                  </p>
                </div>
              </div>

              <div className="profile-timeline-card">

                {/* ACCOUNT CREATED */}

                <div className="profile-timeline-item">
                  <div className="profile-timeline-icon">
                    <CalendarDays size={19} />
                  </div>

                  <div>
                    <span>
                      Account created
                    </span>

                    <strong>
                      {formatDateTime(createdAt)}
                    </strong>
                  </div>
                </div>

                <div className="profile-timeline-divider" />

                {/* PROFILE UPDATED */}

                <div className="profile-timeline-item">
                  <div className="profile-timeline-icon">
                    <Clock3 size={19} />
                  </div>

                  <div>
                    <span>
                      Profile last updated
                    </span>

                    <strong>
                      {formatDateTime(
                        updatedAt || createdAt
                      )}
                    </strong>
                  </div>
                </div>

                <div className="profile-timeline-divider" />

                {/* AUTH STATUS */}

                <div className="profile-timeline-item">
                  <div className="profile-timeline-icon">
                    <CheckCircle2 size={19} />
                  </div>

                  <div>
                    <span>
                      Authentication status
                    </span>

                    <strong>
                      {accountStatus === "Active"
                        ? "Account is active"
                        : "Account is inactive"}
                    </strong>
                  </div>
                </div>

              </div>
            </section>

          </div>
        </main>
      </div>
    </div>
  );
}

export default Profile;
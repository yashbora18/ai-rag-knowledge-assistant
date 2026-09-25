import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react";

import Button from "../../components/common/Button/Button";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../hooks/useToast";
import { resetPassword } from "../../services/authService";

import "./ResetPassword.css";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [isResetComplete, setIsResetComplete] =
    useState(false);

  useEffect(() => {
    const urlToken = searchParams.get("token");

    if (urlToken) {
      setToken(urlToken);
      return;
    }

    const storedLink = localStorage.getItem(
      "rag-password-reset-link"
    );

    if (!storedLink) {
      return;
    }

    try {
      const storedUrl = new URL(storedLink);
      const storedToken =
        storedUrl.searchParams.get("token");

      if (storedToken) {
        setToken(storedToken);
      }
    } catch {
      localStorage.removeItem(
        "rag-password-reset-link"
      );
    }
  }, [searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!token) {
      error(
        "This password reset link is missing or invalid.",
        4000
      );
      return;
    }

    if (password.length < 8) {
      error(
        "Password must be at least 8 characters long.",
        4000
      );
      return;
    }

    if (password !== confirmPassword) {
      error(
        "Passwords do not match.",
        4000
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await resetPassword(
        token,
        password
      );

      localStorage.removeItem(
        "rag-password-reset-link"
      );

      setIsResetComplete(true);

      success(
        response?.message ||
          "Your password has been reset successfully.",
        5000
      );
    } catch (err) {
      const responseMessage =
        err?.response?.data?.detail;

      let message =
        "Unable to reset your password. Please try again.";

      if (Array.isArray(responseMessage)) {
        message =
          responseMessage[0]?.msg || message;
      } else if (
        typeof responseMessage === "string"
      ) {
        message = responseMessage;
      }

      error(message, 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isResetComplete) {
    return (
      <div className="reset-password-page">
        <div className="reset-password-page__topbar">
          <Link
            to="/login"
            className="reset-password-page__back"
          >
            <ArrowLeft size={17} />
            <span>Back to Login</span>
          </Link>

          <button
            type="button"
            className="reset-password-page__theme"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
        </div>

        <main className="reset-password-page__content">
          <section className="reset-password-card">
            <div className="reset-password-card__success-icon">
              <CheckCircle2 size={30} />
            </div>

            <span className="reset-password-card__eyebrow">
              PASSWORD UPDATED
            </span>

            <h1>Password reset successful</h1>

            <p>
              Your password has been updated successfully.
              You can now sign in using your new password.
            </p>

            <Button
              type="button"
              size="large"
              onClick={() => navigate("/login")}
            >
              Continue to Login
            </Button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-page__topbar">
        <Link
          to="/login"
          className="reset-password-page__back"
        >
          <ArrowLeft size={17} />
          <span>Back to Login</span>
        </Link>

        <button
          type="button"
          className="reset-password-page__theme"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun size={18} />
          ) : (
            <Moon size={18} />
          )}
        </button>
      </div>

      <main className="reset-password-page__content">
        <section className="reset-password-card">
          <div className="reset-password-card__brand">
            <div className="reset-password-card__logo">
              <BrainCircuit size={23} />
            </div>

            <span>RAG Knowledge Assistant</span>
          </div>

          <div className="reset-password-card__icon">
            <LockKeyhole size={25} />
          </div>

          <div className="reset-password-card__heading">
            <span className="reset-password-card__eyebrow">
              ACCOUNT SECURITY
            </span>

            <h1>Create a new password</h1>

            <p>
              Choose a strong password for your account.
            </p>
          </div>

          <form
            className="reset-password-form"
            onSubmit={handleSubmit}
          >
            <div className="reset-password-field">
              <label htmlFor="new-password">
                New password
              </label>

              <div className="reset-password-input-wrapper">
                <input
                  id="new-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your new password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="reset-password-field">
              <label htmlFor="confirm-password">
                Confirm new password
              </label>

              <div className="reset-password-input-wrapper">
                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Confirm your new password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="reset-password-requirements">
              <ShieldCheck size={16} />

              <span>
                Use at least 8 characters and avoid
                reusing an old password.
              </span>
            </div>

            <Button
              type="submit"
              size="large"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Updating password..."
                : "Update Password"}
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
}

export default ResetPassword;
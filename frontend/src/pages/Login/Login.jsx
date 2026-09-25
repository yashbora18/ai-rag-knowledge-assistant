import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BrainCircuit,
  Eye,
  EyeOff,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sun,
  X,
} from "lucide-react";

import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";

import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../hooks/useToast";

import {
  loginUser,
  requestPasswordReset,
  saveAccessToken,
} from "../../services/authService";

import "./Login.css";

function Login() {
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();
  const { refreshUser } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecoverySubmitting, setIsRecoverySubmitting] =
    useState(false);

  const [showForgotPassword, setShowForgotPassword] =
    useState(false);

  const [recoveryEmail, setRecoveryEmail] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    remember: false,
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    if (!formData.email.trim()) {
      error("Please enter your email address.", 4000);
      return;
    }

    if (!formData.password) {
      error("Please enter your password.", 4000);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await loginUser({
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      saveAccessToken(response.access_token);

      await refreshUser();

      success(
        "You have been signed in successfully.",
        4000
      );

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      const responseMessage =
        err?.response?.data?.detail;

      let message =
        "Unable to sign in. Please try again.";

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

  const openForgotPassword = () => {
    setRecoveryEmail(formData.email || "");
    setShowForgotPassword(true);
  };

  const closeForgotPassword = () => {
    if (isRecoverySubmitting) {
      return;
    }

    setShowForgotPassword(false);
    setRecoveryEmail("");
  };

  const handleRecoverySubmit = async (event) => {
    event.preventDefault();

    if (isRecoverySubmitting) {
      return;
    }

    const normalizedEmail =
      recoveryEmail.trim().toLowerCase();

    if (!normalizedEmail) {
      error(
        "Please enter your email address.",
        4000
      );
      return;
    }

    try {
      setIsRecoverySubmitting(true);

      const response = await requestPasswordReset({
        email: normalizedEmail,
      });

      success(
        response?.message ||
          "If an account exists for this email, password reset instructions have been generated.",
        5000
      );

      setShowForgotPassword(false);
      setRecoveryEmail("");

      if (response?.reset_link) {
        localStorage.setItem(
          "rag-password-reset-link",
          response.reset_link
        );

        setTimeout(() => {
          window.location.href = response.reset_link;
        }, 700);
      }
    } catch (err) {
      const responseMessage =
        err?.response?.data?.detail;

      let message =
        "Unable to process password recovery. Please try again.";

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
      setIsRecoverySubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <header className="login-page__topbar">
        <Link
          to="/"
          className="login-page__brand"
        >
          <span className="login-page__logo">
            <BrainCircuit
              size={21}
              strokeWidth={2.2}
            />
          </span>

          <span className="login-page__brand-name">
            RAG<span>AI</span>
          </span>
        </Link>

        <button
          type="button"
          className="login-page__theme"
          onClick={toggleTheme}
          aria-label={`Switch to ${
            theme === "light" ? "dark" : "light"
          } mode`}
        >
          {theme === "light" ? (
            <Moon size={18} />
          ) : (
            <Sun size={18} />
          )}
        </button>
      </header>

      <main className="login-page__content">
        <section className="login-page__card">

  <Link
    to="/"
    className="login-page__back"
  >
    <ArrowLeft size={17} />
    <span>Back to Home</span>
  </Link>

  <div className="login-page__header">
    <div className="login-page__icon">
      <LockKeyhole size={23} />
    </div>

            <h1 className="login-page__title">
              Welcome back
            </h1>

            <p className="login-page__subtitle">
              Sign in to continue to your AI
              knowledge workspace.
            </p>
          </div>

          <form
            className="login-page__form"
            onSubmit={handleSubmit}
          >
            <Input
              label="Email address"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />

            <div className="login-page__password-field">
              <label
                htmlFor="password"
                className="login-page__password-label"
              >
                Password <span>*</span>
              </label>

              <div className="login-page__password-input-wrapper">
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className="login-page__password-input"
                  autoComplete="current-password"
                  required
                  disabled={isSubmitting}
                />

                <button
                  type="button"
                  className="login-page__password-toggle"
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
                  aria-pressed={showPassword}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff
                      size={19}
                      strokeWidth={2}
                    />
                  ) : (
                    <Eye
                      size={19}
                      strokeWidth={2}
                    />
                  )}
                </button>
              </div>
            </div>

            <div className="login-page__options">
              <label className="login-page__remember">
                <input
                  type="checkbox"
                  name="remember"
                  checked={formData.remember}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />

                <span>Remember me</span>
              </label>

              <button
                type="button"
                className="login-page__forgot"
                onClick={openForgotPassword}
                disabled={isSubmitting}
              >
                Forgot password?
              </button>
            </div>

            <div className="login-page__submit">
              <Button
                type="submit"
                size="large"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Signing in..."
                  : "Sign in"}
              </Button>
            </div>
          </form>

          <div className="login-page__security">
            <ShieldCheck
              size={16}
              strokeWidth={2}
            />

            <span>
              Your account and knowledge workspace
              are protected with secure authentication.
            </span>
          </div>

          <div className="login-page__divider">
            <span>or</span>
          </div>

          <p className="login-page__register">
            Don't have an account?

            <Link to="/register">
              Create one
            </Link>
          </p>
        </section>
      </main>

      <footer className="login-page__footer">
        © {new Date().getFullYear()} RAGAI. All rights
        reserved.
      </footer>

      {showForgotPassword && (
        <div
          className="login-page__modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !isRecoverySubmitting
            ) {
              closeForgotPassword();
            }
          }}
        >
          <section
            className="login-page__modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
          >
            <button
              type="button"
              className="login-page__modal-close"
              onClick={closeForgotPassword}
              aria-label="Close password recovery"
              disabled={isRecoverySubmitting}
            >
              <X size={19} />
            </button>

            <div className="login-page__modal-icon">
              <LockKeyhole size={21} />
            </div>

            <h2
              id="forgot-password-title"
              className="login-page__modal-title"
            >
              Forgot your password?
            </h2>

            <p className="login-page__modal-description">
              Enter the email address associated with
              your account.
            </p>

            <form
              className="login-page__recovery-form"
              onSubmit={handleRecoverySubmit}
            >
              <Input
                label="Email address"
                name="recoveryEmail"
                type="email"
                placeholder="you@example.com"
                value={recoveryEmail}
                onChange={(event) =>
                  setRecoveryEmail(
                    event.target.value
                  )
                }
                autoComplete="email"
                required
                disabled={isRecoverySubmitting}
              />

              <button
                type="submit"
                className="login-page__recovery-button"
                disabled={isRecoverySubmitting}
              >
                {isRecoverySubmitting
                  ? "Sending..."
                  : "Request password reset"}
              </button>
            </form>

            <p className="login-page__modal-note">
              If an account exists for this email, you
              will receive password reset instructions.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

export default Login;
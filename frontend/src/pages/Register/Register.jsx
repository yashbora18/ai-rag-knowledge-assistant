import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BrainCircuit,
  Eye,
  EyeOff,
  Moon,
  ShieldCheck,
  Sun,
  UserPlus,
} from "lucide-react";

import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";
import { useTheme } from "../../hooks/useTheme";
import { useToast } from "../../hooks/useToast";
import { registerUser } from "../../services/authService";

import "./Register.css";

function Register() {
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    terms: false,
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

    if (formData.password !== formData.confirmPassword) {
      error(
        "Passwords do not match.",
        "Registration failed"
      );
      return;
    }

    if (formData.password.length < 8) {
      error(
        "Password must contain at least 8 characters.",
        "Registration failed"
      );
      return;
    }

    if (!formData.terms) {
      error(
        "Please accept the Terms of Service and Privacy Policy.",
        "Registration failed"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });

      success(
        "Your account has been created successfully.",
        "Welcome to RAGAI"
      );

      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });

      setShowPassword(false);
      setShowConfirmPassword(false);

      setTimeout(() => {
        navigate("/login");
      }, 900);
    } catch (err) {
      const responseMessage =
        err.response?.data?.detail;

      let message =
        "Unable to create your account. Please try again.";

      if (Array.isArray(responseMessage)) {
        message =
          responseMessage[0]?.msg ||
          message;
      } else if (typeof responseMessage === "string") {
        message = responseMessage;
      }

      error(
        message,
        "Registration failed"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      {/* ========================================
          TOP BAR
          ======================================== */}

      <header className="register-page__topbar">
        <Link
          to="/"
          className="register-page__brand"
        >
          <span className="register-page__logo">
            <BrainCircuit
              size={21}
              strokeWidth={2.2}
            />
          </span>

          <span className="register-page__brand-name">
            RAG<span>AI</span>
          </span>
        </Link>

        <button
          type="button"
          className="register-page__theme"
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
      </header>

      {/* ========================================
          REGISTRATION CONTENT
          ======================================== */}

      <main className="register-page__content">
        <section className="register-page__card">
  <Link
    to="/"
    className="register-page__back"
  >
    <ArrowLeft size={17} />
    <span>Back to Home</span>
  </Link>

  {/* Header */}

          <div className="register-page__header">
            <div className="register-page__icon">
              <UserPlus size={23} />
            </div>

            <h1 className="register-page__title">
              Create your account
            </h1>

            <p className="register-page__subtitle">
              Start turning your documents into
              intelligent conversations.
            </p>
          </div>

          {/* Form */}

          <form
            className="register-page__form"
            onSubmit={handleSubmit}
          >
            {/* Full Name */}

            <Input
              label="Full name"
              name="name"
              type="text"
              placeholder="Your full name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />

            {/* Email */}

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

            {/* ========================================
                PASSWORD
                ======================================== */}

            <div className="register-page__password-field">
              <label
                htmlFor="register-password"
                className="register-page__password-label"
              >
                Password <span>*</span>
              </label>

              <div className="register-page__password-input-wrapper">
                <input
                  id="register-password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="register-page__password-input"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />

                <button
                  type="button"
                  className="register-page__password-toggle"
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

              <p className="register-page__password-helper">
                Use at least 8 characters.
              </p>
            </div>

            {/* ========================================
                CONFIRM PASSWORD
                ======================================== */}

            <div className="register-page__password-field">
              <label
                htmlFor="register-confirm-password"
                className="register-page__password-label"
              >
                Confirm password <span>*</span>
              </label>

              <div className="register-page__password-input-wrapper">
                <input
                  id="register-confirm-password"
                  name="confirmPassword"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="register-page__password-input"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />

                <button
                  type="button"
                  className="register-page__password-toggle"
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
                  aria-pressed={showConfirmPassword}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
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

            {/* Terms */}

            <label className="register-page__terms">
              <input
                type="checkbox"
                name="terms"
                checked={formData.terms}
                onChange={handleChange}
                disabled={isSubmitting}
                required
              />

              <span>
                I agree to{" "}
                <a
                  href="#terms"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#privacy"
                  onClick={(event) =>
                    event.preventDefault()
                  }
                >
                  Privacy Policy
                </a>
                .
              </span>
            </label>

            {/* Submit */}

            <div className="register-page__submit">
              <Button
                type="submit"
                size="large"
                loading={isSubmitting}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Creating account..."
                  : "Create account"}
              </Button>
            </div>
          </form>

          {/* Security Divider */}

          <div className="register-page__divider">
            <span>
              <ShieldCheck size={14} />
            </span>
          </div>

          {/* Login */}

          <p className="register-page__login">
            Already have an account?
            <Link to="/login">
              Sign in
            </Link>
          </p>
        </section>
      </main>

      {/* Footer */}

      <footer className="register-page__footer">
        © {new Date().getFullYear()} RAGAI. All rights
        reserved.
      </footer>
    </div>
  );
}

export default Register;
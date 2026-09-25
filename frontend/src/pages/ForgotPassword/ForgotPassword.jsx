import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BrainCircuit,
  Mail,
  Moon,
  Sun,
} from "lucide-react";

import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { useTheme } from "../../hooks/useTheme";
import useToast from "../../hooks/useToast";

import { requestPasswordReset } from "../../services/authService";

import "./ForgotPassword.css";

function ForgotPassword() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { success, error } = useToast();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      error("Please enter your email address.", 4000);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      error("Please enter a valid email address.", 4000);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await requestPasswordReset({
        email: normalizedEmail,
      });

      success(
        response?.message ||
          "If an account exists, password reset instructions have been sent.",
        5000
      );

      setEmail("");
    } catch (requestError) {
      error(
        requestError?.response?.data?.detail ||
          "Unable to process your request. Please try again.",
        4000
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-page__topbar">
        <Link
          to="/login"
          className="forgot-password-page__back"
        >
          <ArrowLeft size={17} />
          <span>Back to Login</span>
        </Link>

        <button
          type="button"
          className="forgot-password-page__theme"
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

      <main className="forgot-password-page__content">
        <section className="forgot-password-card">
          <div className="forgot-password-card__brand">
            <div className="forgot-password-card__logo">
              <BrainCircuit size={24} />
            </div>

            <span>RAG Knowledge Assistant</span>
          </div>

          <div className="forgot-password-card__icon">
            <Mail size={25} />
          </div>

          <div className="forgot-password-card__heading">
            <span className="forgot-password-card__eyebrow">
              ACCOUNT RECOVERY
            </span>

            <h1>Forgot your password?</h1>

            <p>
              Enter the email address associated with your account
              and we&apos;ll send you instructions to reset your
              password.
            </p>
          </div>

          <form
            className="forgot-password-form"
            onSubmit={handleSubmit}
          >
            <Input
              label="Email address"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              disabled={isSubmitting}
            />

            <Button
              type="submit"
              disabled={isSubmitting}
              fullWidth
            >
              {isSubmitting
                ? "Sending instructions..."
                : "Send Reset Instructions"}
            </Button>
          </form>

          <div className="forgot-password-card__footer">
            <span>Remember your password?</span>

            <button
              type="button"
              onClick={() => navigate("/login")}
            >
              Sign in
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ForgotPassword;
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileSearch,
  FileText,
  MessageSquareText,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../../components/layout/Navbar/Navbar";
import Button from "../../components/common/Button/Button";
import "./Landing.css";

function Landing() {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered RAG",
      description:
        "Ask natural-language questions and receive answers grounded in your own uploaded knowledge.",
    },
    {
      icon: FileText,
      title: "Document Intelligence",
      description:
        "Bring your documents together and turn scattered information into a searchable knowledge base.",
    },
    {
      icon: MessageSquareText,
      title: "Natural Conversations",
      description:
        "Interact with your knowledge through a simple conversational interface designed for fast answers.",
    },
    {
      icon: FileSearch,
      title: "Source Citations",
      description:
        "Understand where answers come from with clear document and source references.",
    },
    {
      icon: BarChart3,
      title: "Knowledge Analytics",
      description:
        "Track your knowledge activity and understand how your documents and conversations are being used.",
    },
    {
      icon: LockKeyhole,
      title: "Secure Access",
      description:
        "Keep your knowledge experience protected with authenticated access and controlled application routes.",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: Upload,
      title: "Upload your documents",
      description:
        "Add the documents that contain the knowledge you want to work with.",
    },
    {
      number: "02",
      icon: Zap,
      title: "Build your knowledge",
      description:
        "Your documents become part of a searchable knowledge experience powered by retrieval.",
    },
    {
      number: "03",
      icon: MessageSquareText,
      title: "Ask your questions",
      description:
        "Ask questions naturally and get responses based on the information in your documents.",
    },
    {
      number: "04",
      icon: CheckCircle2,
      title: "Explore cited answers",
      description:
        "Review grounded responses and their source context to understand the answer.",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="landing">
        {/* ========================================
            HERO
            ======================================== */}
        <section className="landing__hero">
          <div className="landing__hero-content">
            <div className="landing__badge">
              <span className="landing__badge-dot" />
              AI-powered document intelligence
            </div>

            <h1 className="landing__title">
              Turn your documents into
              <span className="landing__title-gradient">
                {" "}
                intelligent conversations.
              </span>
            </h1>

            <p className="landing__description">
              Upload your documents, ask questions in natural language,
              and get accurate answers grounded in your own knowledge —
              with clear source citations.
            </p>

            <div className="landing__actions">
              <Link to="/register">
                <Button size="large">
                  Start for free
                  <ArrowRight size={18} />
                </Button>
              </Link>

              <a href="#how-it-works">
                <Button variant="secondary" size="large">
                  See how it works
                </Button>
              </a>
            </div>

            <div className="landing__trust">
              <CheckCircle2
                size={16}
                className="landing__trust-icon"
              />
              No credit card required
              <span>•</span>
              Built for secure knowledge access
            </div>
          </div>
        </section>

        {/* ========================================
            REAL PRODUCT PREVIEW
            ======================================== */}
        <section
          className="landing__preview"
          aria-label="RAG Knowledge Assistant dashboard preview"
        >
          <div className="landing__preview-glow" />

          <div className="landing__preview-window landing__preview-window--real">
            <img
              src="/dashboard-preview.png"
              alt="RAG Knowledge Assistant dashboard"
              className="landing__dashboard-image"
            />
          </div>
        </section>

        {/* ========================================
            HOW IT WORKS
            ======================================== */}
        <section
          id="how-it-works"
          className="landing__section landing__how"
        >
          <div className="landing__section-heading">
            <span className="landing__section-eyebrow">
              HOW IT WORKS
            </span>

            <h2 className="landing__section-title">
              From documents to answers
              <span className="landing__section-title-accent">
                {" "}
                in four simple steps.
              </span>
            </h2>

            <p className="landing__section-description">
              Build a personal knowledge workspace and interact with
              your information through a simple AI-powered workflow.
            </p>
          </div>

          <div className="landing__steps">
            {steps.map((step) => {
              const Icon = step.icon;

              return (
                <article
                  className="landing__step"
                  key={step.number}
                >
                  <div className="landing__step-top">
                    <span className="landing__step-number">
                      {step.number}
                    </span>

                    <div className="landing__step-icon">
                      <Icon size={22} />
                    </div>
                  </div>

                  <h3>{step.title}</h3>

                  <p>{step.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        {/* ========================================
            FEATURES
            ======================================== */}
        <section
          id="features"
          className="landing__section landing__features"
        >
          <div className="landing__section-heading">
            <span className="landing__section-eyebrow">
              POWERFUL FEATURES
            </span>

            <h2 className="landing__section-title">
              Everything you need to work with
              <span className="landing__section-title-accent">
                {" "}
                your knowledge.
              </span>
            </h2>

            <p className="landing__section-description">
              A focused knowledge assistant designed to make your
              documents easier to understand, search, and use.
            </p>
          </div>

          <div className="landing__features-grid">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  className="landing__feature-card"
                  key={feature.title}
                >
                  <div className="landing__feature-icon">
                    <Icon size={21} />
                  </div>

                  <div className="landing__feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* ========================================
            SECURITY
            ======================================== */}
        <section
          id="security"
          className="landing__security"
        >
          <div className="landing__security-glow" />

          <div className="landing__security-content">
            <div className="landing__security-icon">
              <ShieldCheck size={28} />
            </div>

            <span className="landing__section-eyebrow">
              BUILT WITH SECURITY IN MIND
            </span>

            <h2 className="landing__security-title">
              Your knowledge stays behind
              <span className="landing__section-title-accent">
                {" "}
                protected access.
              </span>
            </h2>

            <p className="landing__security-description">
              RAG Knowledge Assistant is designed around authenticated
              access, protected application routes, and a dedicated
              workspace for your documents and conversations.
            </p>

            <div className="landing__security-points">
              <div className="landing__security-point">
                <CheckCircle2 size={17} />
                <span>Authenticated user access</span>
              </div>

              <div className="landing__security-point">
                <CheckCircle2 size={17} />
                <span>Protected knowledge workspace</span>
              </div>

              <div className="landing__security-point">
                <CheckCircle2 size={17} />
                <span>Controlled application routes</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================
            FINAL CTA
            ======================================== */}
        <section className="landing__cta">
          <div className="landing__cta-content">
            <div className="landing__cta-icon">
              <BrainCircuitIcon />
            </div>

            <h2>
              Ready to turn your documents into knowledge?
            </h2>

            <p>
              Create your workspace and start having intelligent
              conversations with your documents.
            </p>

            <div className="landing__cta-actions">
              <Link to="/register">
                <Button size="large">
                  Get started for free
                  <ArrowRight size={18} />
                </Button>
              </Link>

              <Link to="/login">
                <Button variant="secondary" size="large">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================
          FOOTER
          ======================================== */}
      <footer className="landing__footer">
        <div className="landing__footer-inner">
          <Link to="/" className="landing__footer-brand">
            <span className="landing__footer-logo">
              <BrainCircuitIcon />
            </span>

            <span>
              RAG<span>AI</span>
            </span>
          </Link>

          <p>
            © {new Date().getFullYear()} RAGAI. All rights reserved.
          </p>

          <div className="landing__footer-links">
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function BrainCircuitIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 5V3" />
      <path d="M12 21v-2" />
      <path d="M5 12H3" />
      <path d="M21 12h-2" />
      <path d="M18.36 5.64 20 4" />
      <path d="m4 20 1.64-1.64" />
      <path d="m18.36 18.36 1.64 1.64" />
      <path d="M4 4l1.64 1.64" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 9v6" />
      <path d="M9 12h6" />
    </svg>
  );
}

export default Landing;
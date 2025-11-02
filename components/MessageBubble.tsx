import clsx from "clsx";
import { ReactNode } from "react";

type AgentStep = {
  title: string;
  content: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  steps?: AgentStep[];
  suggestions?: string[];
};

function formatContent(content: string): ReactNode {
  const paragraphs = content.trim().split(/\n{2,}/);
  return paragraphs.map((paragraph, index) => {
    const isList = paragraph.trim().startsWith("- ") || paragraph.includes("\n- ");
    if (isList) {
      const items = paragraph
        .split("\n")
        .map((line) => line.replace(/^-+\s*/, "").trim())
        .filter(Boolean);
      return (
        <ul key={`list-${index}`}>
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      );
    }
    return <p key={`para-${index}`}>{paragraph}</p>;
  });
}

export default function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <article
      className={clsx("bubble", {
        "bubble--user": isUser,
        "bubble--assistant": !isUser
      })}
    >
      <div className="bubble__role" aria-hidden>
        {isUser ? "You" : "Radius"}
      </div>
      <div className="bubble__content">{formatContent(message.content)}</div>

      {!isUser && message.steps && message.steps.length > 0 && (
        <div className="bubble__steps" aria-label="Agent reasoning">
          {message.steps.map((step) => (
            <div className="step" key={step.title}>
              <span className="step__title">{step.title}</span>
              <p className="step__body">{step.content}</p>
            </div>
          ))}
        </div>
      )}

      {!isUser && message.suggestions && message.suggestions.length > 0 && (
        <div className="bubble__suggestions" aria-label="Follow-up ideas">
          {message.suggestions.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      )}

      <style jsx>{`
        .bubble {
          position: relative;
          padding: 1.15rem 1.35rem;
          border-radius: 20px;
          background: rgba(26, 28, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.04);
          display: grid;
          gap: 0.6rem;
        }

        .bubble--user {
          margin-left: auto;
          border-color: rgba(79, 70, 229, 0.35);
          background: rgba(79, 70, 229, 0.12);
        }

        .bubble--assistant {
          margin-right: auto;
        }

        .bubble__role {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          font-weight: 600;
        }

        .bubble__content {
          display: grid;
          gap: 0.45rem;
          color: var(--text-secondary);
          line-height: 1.55;
        }

        .bubble__content p {
          margin: 0;
        }

        ul {
          margin: 0;
          padding-left: 1.1rem;
          display: grid;
          gap: 0.25rem;
        }

        li::marker {
          color: var(--accent);
        }

        .bubble__steps {
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 0.75rem;
          display: grid;
          gap: 0.75rem;
        }

        .step {
          background: rgba(15, 18, 31, 0.85);
          border-radius: 14px;
          padding: 0.75rem 0.9rem;
          border: 1px solid rgba(79, 70, 229, 0.1);
          display: grid;
          gap: 0.35rem;
        }

        .step__title {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(170, 177, 255, 0.88);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }

        .step__body {
          margin: 0;
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .bubble__suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          padding-top: 0.3rem;
        }

        .chip {
          background: rgba(79, 70, 229, 0.1);
          color: rgba(215, 218, 255, 0.9);
          border: 1px solid rgba(79, 70, 229, 0.25);
          border-radius: 999px;
          padding: 0.3rem 0.75rem;
          font-size: 0.75rem;
          letter-spacing: 0.01em;
        }
      `}</style>
    </article>
  );
}

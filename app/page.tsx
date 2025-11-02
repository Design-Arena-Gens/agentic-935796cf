"use client";

import Chat from "@/components/Chat";

export default function Home() {
  return (
    <main className="page">
      <div className="page__hero">
        <div>
          <span className="page__badge">Agentic Prototype</span>
          <h1>Meet your focused AI copilot</h1>
          <p>
            This lightweight agent analyses your prompt, decides which tools to
            use, and responds with clear next steps. Ask it to plan, reason, or
            compute—no API keys required.
          </p>
        </div>
      </div>

      <Chat />

      <style jsx>{`
        .page {
          width: min(960px, 100%);
          display: grid;
          gap: 2rem;
        }
        .page__hero {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 2.25rem;
          box-shadow: 0 20px 45px rgba(12, 18, 36, 0.45);
        }
        .page__badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--accent-soft);
          color: var(--accent);
          padding: 0.35rem 0.85rem;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }
        h1 {
          margin: 1.2rem 0 0.65rem;
          font-size: clamp(2.1rem, 3vw, 3rem);
          line-height: 1.1;
        }
        p {
          margin: 0;
          color: var(--text-secondary);
          max-width: 60ch;
          font-size: 1.05rem;
        }

        @media (max-width: 640px) {
          .page__hero {
            padding: 1.75rem;
          }
          h1 {
            font-size: clamp(1.9rem, 6vw, 2.4rem);
          }
        }
      `}</style>
    </main>
  );
}

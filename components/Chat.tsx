import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import MessageBubble from "./MessageBubble";

type CoreMessage = {
  role: "user" | "assistant";
  content: string;
};

type AgentStep = {
  title: string;
  content: string;
};

type AgentReply = CoreMessage & {
  steps?: AgentStep[];
  suggestions?: string[];
};

type ConversationMessage = AgentReply & { id: string };

const SAMPLE_PROMPTS = [
  "Help me plan a focused 30-minute workout that alternates cardio and strength.",
  "I need three marketing ideas for a zero-waste coffee brand.",
  "Summarize our conversation so far in bullet points.",
  "Solve: If I invest $150 monthly at 5% annual interest, what's the balance after 3 years?"
];

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

export default function Chat() {
  const [messages, setMessages] = useState<ConversationMessage[]>(() => [
    {
      id: createId(),
      role: "assistant",
      content:
        "Hi, I am Radius. I can break down your goals, crunch quick numbers, and suggest concrete next steps. What should we work on?",
      suggestions: [
        "Plan my afternoon to finish two tasks",
        "Draft a friendly follow-up email",
        "Help me estimate a monthly budget"
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = listRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });
  }, [messages]);

  const roundedMessages = useMemo<CoreMessage[]>(() => {
    return messages.map(({ role, content }) => ({ role, content }));
  }, [messages]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!input.trim() || pending) return;

    const userMessage: ConversationMessage = {
      id: createId(),
      role: "user",
      content: input.trim()
    };
    setInput("");
    setMessages((prev) => [...prev, userMessage]);
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...roundedMessages, { role: "user", content: userMessage.content }]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach the agent.");
      }

      const payload: AgentReply = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          ...payload
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          content:
            "I ran into a glitch while thinking. Try again in a moment or rephrase your request."
        }
      ]);
      console.error(error);
    } finally {
      setPending(false);
    }
  }

  function handlePromptSelect(prompt: string) {
    if (pending) return;
    setInput(prompt);
  }

  return (
    <section className="chat">
      <div className="chat__body">
        <div className="chat__messages" ref={listRef} role="log" aria-live="polite">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {pending && (
            <div className="chat__thinking">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          )}
        </div>

        <form className="chat__composer" onSubmit={handleSubmit}>
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask for a plan, a calculation, or a creative brainstorm..."
            aria-label="Message Radius"
            rows={3}
            disabled={pending}
          />
          <div className="chat__composer-footer">
            <button
              type="submit"
              className={clsx("chat__submit", { "chat__submit--disabled": pending })}
              disabled={pending}
            >
              {pending ? "Thinking..." : "Send"}
            </button>
            <span className="chat__hint">
              Radius picks tools automatically — try combining tasks in one request.
            </span>
          </div>
        </form>
      </div>

      <div className="chat__suggestions" aria-label="Sample prompts">
        {SAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handlePromptSelect(prompt)}
            disabled={pending}
          >
            {prompt}
          </button>
        ))}
      </div>

      <style jsx>{`
        .chat {
          display: grid;
          gap: 1.5rem;
        }
        .chat__body {
          background: linear-gradient(145deg, #131728 15%, #0d111f 85%);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          padding: 1.6rem;
          display: grid;
          gap: 1.25rem;
          box-shadow: 0 35px 70px rgba(9, 12, 26, 0.45);
        }

        .chat__messages {
          max-height: min(420px, 50vh);
          overflow-y: auto;
          display: grid;
          gap: 1rem;
          padding-right: 0.35rem;
        }

        .chat__messages::-webkit-scrollbar {
          width: 6px;
        }
        .chat__messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 999px;
        }

        .chat__thinking {
          display: inline-flex;
          gap: 0.35rem;
          padding: 0.8rem 1rem;
          border-radius: 16px;
          background: rgba(30, 29, 43, 0.85);
          width: fit-content;
        }
        .chat__thinking .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          animation: blink 1.2s infinite ease-in-out;
        }
        .chat__thinking .dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .chat__thinking .dot:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes blink {
          0%,
          80%,
          100% {
            opacity: 0.3;
          }
          40% {
            opacity: 1;
          }
        }

        .chat__composer {
          display: grid;
          gap: 0.75rem;
        }

        textarea {
          width: 100%;
          resize: none;
          padding: 1rem 1.1rem;
          border-radius: 18px;
          background: rgba(19, 26, 44, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
          font-size: 1rem;
          line-height: 1.5;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          min-height: 120px;
        }

        textarea:focus {
          outline: none;
          border-color: rgba(79, 70, 229, 0.7);
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.25);
        }

        textarea:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .chat__composer-footer {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
        }

        .chat__submit {
          background: var(--accent);
          color: white;
          padding: 0.65rem 1.4rem;
          border-radius: 999px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .chat__submit:hover:not(.chat__submit--disabled) {
          transform: translateY(-1px);
          box-shadow: 0 15px 35px rgba(79, 70, 229, 0.25);
        }

        .chat__submit--disabled {
          cursor: wait;
          opacity: 0.6;
        }

        .chat__hint {
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        .chat__suggestions {
          display: grid;
          gap: 0.85rem;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }

        .chat__suggestions button {
          background: rgba(19, 21, 34, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          border-radius: 18px;
          padding: 0.9rem 1rem;
          text-align: left;
          cursor: pointer;
          transition: transform 0.15s ease, border-color 0.2s ease,
            background 0.2s ease;
        }

        .chat__suggestions button:hover {
          border-color: rgba(79, 70, 229, 0.5);
          background: rgba(79, 70, 229, 0.08);
          transform: translateY(-1px);
        }

        .chat__suggestions button:disabled {
          cursor: not-allowed;
          opacity: 0.6;
        }

        @media (max-width: 720px) {
          .chat__body {
            padding: 1.25rem;
          }
        }
      `}</style>
    </section>
  );
}

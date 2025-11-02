import { Parser } from "expr-eval";

export type AgentRole = "system" | "user" | "assistant";

export type AgentMessage = {
  role: AgentRole;
  content: string;
};

export type AgentStep = {
  title: string;
  content: string;
};

export type AgentReply = {
  role: "assistant";
  content: string;
  steps: AgentStep[];
  suggestions: string[];
};

type Intent =
  | "math"
  | "plan"
  | "brainstorm"
  | "summarize"
  | "prioritize"
  | "insight";

const parser = new Parser();

const KNOWLEDGE_BASE: Array<{ triggers: RegExp[]; response: string }> = [
  {
    triggers: [/productivity|focus|deep work/i],
    response:
      "- Alternate 50 minutes of focus with 10-minute resets.\n- Decide the single critical output before you start.\n- Park distracting ideas in an inbox so you can return without losing flow."
  },
  {
    triggers: [/marketing|campaign|launch/i],
    response:
      "- Anchor on one memorable story per audience segment.\n- Repurpose high-performing assets into quick experiments on new channels.\n- Blend a fast feedback metric (CTR) with a slower health metric (share of conversation)."
  },
  {
    triggers: [/learning|study|exam/i],
    response:
      "- Begin with a spaced repetition sweep to surface weak spots.\n- Convert theories into applied micro-projects within 24 hours.\n- Teach the concept back to someone (or your notes) in plain language."
  }
];

function cleanExpression(input: string): string | null {
  const candidate = input
    .replace(/[^0-9+\-*/%^().,\s]/g, "")
    .replace(/,/g, "");
  if (!candidate.trim()) return null;
  if (!/[0-9]/.test(candidate)) return null;
  return candidate;
}

function calculateExpression(input: string): string {
  const expression = cleanExpression(input);
  if (!expression) {
    return "I could not detect a solvable expression. Try something like `3 * (12 + 4)`.";
  }
  try {
    const result = parser.evaluate(expression);
    if (typeof result === "number" && Number.isFinite(result)) {
      const formatted =
        Math.abs(result) >= 1_000
          ? result.toLocaleString(undefined, { maximumFractionDigits: 4 })
          : Number(result.toPrecision(8)).toString();
      return `The expression ${expression.trim()} evaluates to **${formatted}**.`;
    }
    return "That expression resolves to a non-numeric result, which I do not support yet.";
  } catch (error) {
    return "That expression seems malformed. Try using only numbers and standard operators.";
  }
}

function buildPlan(goal: string): string {
  const trimmed = goal.trim();
  const tasks = [
    `Clarify the true objective and define a measurable finish line for "${trimmed}".`,
    "List the constraints (time, budget, collaborators) so we can work within them.",
    "Break the work into 3-5 atomic actions that can each be completed in one sitting.",
    "Sequence the actions by impact and dependency, then block time for the first step.",
    "Create a feedback hook — what evidence will tell us we can adjust or stop?"
  ];
  return tasks.map((task, index) => `${index + 1}. ${task}`).join("\n");
}

function brainstormIdeas(topic: string): string {
  const angles = [
    "Unexpected partnerships or audiences",
    "Moments in the customer journey you can delight",
    "Small experiments you can ship this week",
    "Signals that prove the idea is working"
  ];
  const ideas = angles.map(
    (angle, idx) =>
      `${idx + 1}. ${angle} — specifically for "${topic.trim()}". Think about what would feel refreshing compared to the status quo.`
  );
  return ideas.join("\n");
}

function summarizeConversation(history: AgentMessage[]): string {
  const lastFew = history.slice(-6).filter((item) => item.role !== "system");
  if (!lastFew.length) {
    return "We've just started chatting, so there's nothing to summarise yet.";
  }
  const bulletPoints = lastFew.map((item) => {
    const speaker = item.role === "assistant" ? "Radius" : "You";
    return `- ${speaker}: ${item.content.replace(/\s+/g, " ").trim()}`;
  });
  return ["Here's what we covered recently:", ...bulletPoints].join("\n");
}

function prioritiseTasks(input: string): string {
  const lines = input
    .split(/\n|,|;/)
    .map((line) => line.trim())
    .filter((line) => line.length > 4);
  if (lines.length === 0) {
    return "Please provide a list of tasks separated by commas or new lines so I can rank them.";
  }
  const ranked = lines.map((task, index) => {
    const urgencyScore = /today|urgent|now|soon|asap/i.test(task) ? 3 : 1;
    const impactScore = /launch|client|revenue|milestone|deadline/i.test(task)
      ? 3
      : /review|prep|draft/i.test(task)
      ? 2
      : 1;
    const score = urgencyScore * 2 + impactScore;
    return { task, score, index };
  });
  ranked.sort((a, b) => b.score - a.score || a.index - b.index);
  return ranked
    .map((item, position) => `${position + 1}. ${item.task} — priority score ${item.score}`)
    .join("\n");
}

function matchKnowledge(input: string): string | null {
  const entry = KNOWLEDGE_BASE.find(({ triggers }) =>
    triggers.some((regex) => regex.test(input))
  );
  return entry ? entry.response : null;
}

function classifyIntent(input: string): Intent {
  if (/[0-9][0-9+\-*/%^().\s]+[0-9]/.test(input)) return "math";
  if (/plan|schedule|roadmap|steps|strategy/i.test(input)) return "plan";
  if (/idea|ideas|brainstorm|creative|names?/i.test(input)) return "brainstorm";
  if (/summarise|summarize|recap|tl;dr/i.test(input)) return "summarize";
  if (/prioriti[sz]e|ranking|order.*tasks|what to do first/i.test(input)) {
    return "prioritize";
  }
  return "insight";
}

function followUpSuggestions(intent: Intent): string[] {
  switch (intent) {
    case "math":
      return [
        "Compare this result with another scenario",
        "Ask me to turn the numbers into a short explanation",
        "Create a table of outcomes with different variables"
      ];
    case "plan":
      return [
        "Request a 7-day timeline for the plan",
        "Ask for the single most important milestone",
        "Turn the plan into calendar-friendly blocks"
      ];
    case "brainstorm":
      return [
        "Narrow ideas down to one standout concept",
        "Turn this concept into a user journey",
        "Draft a 3-sentence pitch for the top idea"
      ];
    case "summarize":
      return [
        "Extract action items from the summary",
        "Highlight risks or open questions",
        "Refine the summary for a stakeholder update"
      ];
    case "prioritize":
      return [
        "Group tasks by effort versus impact",
        "Schedule the top task with a realistic time slot",
        "Delegate or defer the lowest priorities"
      ];
    default:
      return [
        "Ask me to dive deeper into one takeaway",
        "Layer in real constraints (time, budget, audience)",
        "Convert this into an actionable checklist"
      ];
  }
}

export async function runAgent(messages: AgentMessage[]): Promise<AgentReply> {
  const last = [...messages]
    .reverse()
    .find((message) => message.role === "user");

  const steps: AgentStep[] = [];

  if (!last) {
    return {
      role: "assistant",
      content: "I'm ready whenever you are.",
      steps: [
        {
          title: "Status",
          content: "No user input detected, so I am idling."
        }
      ],
      suggestions: [
        "Give me a goal with a tight deadline",
        "Ask me to condense a long message",
        "Share tasks and I will prioritise them"
      ]
    };
  }

  const userText = last.content.trim();
  const intent = classifyIntent(userText);
  steps.push({
    title: "Intent Detection",
    content: `Input suggests a **${intent}** style response.`
  });

  let content: string;
  switch (intent) {
    case "math": {
      content = calculateExpression(userText);
      steps.push({
        title: "Tool",
        content: "Evaluated arithmetic expression using the safe math parser."
      });
      break;
    }
    case "plan": {
      content = buildPlan(userText);
      steps.push({
        title: "Method",
        content: "Expanded request into a structured plan with five sequenced actions."
      });
      break;
    }
    case "brainstorm": {
      content = brainstormIdeas(userText);
      steps.push({
        title: "Method",
        content: "Generated four contrasting idea angles to encourage divergent thinking."
      });
      break;
    }
    case "summarize": {
      content = summarizeConversation(messages);
      steps.push({
        title: "Method",
        content: "Compressed the last exchanges into a concise bullet-point recap."
      });
      break;
    }
    case "prioritize": {
      content = prioritiseTasks(userText);
      steps.push({
        title: "Method",
        content:
          "Ranked supplied tasks based on urgency and impact heuristics to highlight what to do first."
      });
      break;
    }
    default: {
      const insight = matchKnowledge(userText);
      if (insight) {
        content = insight;
        steps.push({
          title: "Knowledge",
          content: "Matched the topic against the curated playbook and surfaced relevant tactics."
        });
      } else {
        content =
          "- Reflect your objective in one sentence to confirm I understood it correctly.\n" +
          "- Identify one blocker or variable that worries you.\n" +
          "- Ask for a concrete artefact: plan, outline, script, calculation, or critique.";
        steps.push({
          title: "Fallback",
          content:
            "No direct tool matched, so I offered a structured prompt to refine the conversation."
        });
      }
      break;
    }
  }

  const suggestions = followUpSuggestions(intent);
  steps.push({
    title: "Next Move",
    content: "Suggested follow-up paths to continue the session."
  });

  return {
    role: "assistant",
    content,
    steps,
    suggestions
  };
}

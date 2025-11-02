import { NextRequest, NextResponse } from "next/server";
import { runAgent, type AgentMessage } from "@/lib/agent";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const messages = (body?.messages ?? []) as AgentMessage[];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one user message." },
        { status: 400 }
      );
    }

    const response = await runAgent(messages);
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Unexpected agent error. Please try again." },
      { status: 500 }
    );
  }
}

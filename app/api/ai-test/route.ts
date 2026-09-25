import { NextResponse } from "next/server";

export async function GET() {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "OPENROUTER_API_KEY is missing",
        },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "http://localhost:3000",
          "X-Title": "ONEQUESTION",
        },
        body: JSON.stringify({
          model: "openrouter/free",
          messages: [
            {
              role: "user",
              content: "Reply with exactly: ONEQUESTION AI WORKS",
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter error:", data);

      return NextResponse.json(
        {
          success: false,
          error: data?.error?.message || "OpenRouter request failed",
        },
        { status: response.status }
      );
    }

    const text = data?.choices?.[0]?.message?.content || "";

    return NextResponse.json({
      success: true,
      text,
    });
  } catch (error) {
    console.error("AI test error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Could not connect to OpenRouter",
      },
      { status: 500 }
    );
  }
}
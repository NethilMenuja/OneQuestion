export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "OPENROUTER_API_KEY is missing" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const answer =
      typeof body?.answer === "string"
        ? body.answer.trim()
        : "";

    if (!answer) {
      return Response.json(
        { error: "Answer is required." },
        { status: 400 }
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
              content: `
You are a content safety assistant for ONEQUESTION.

Review this user-generated answer:

${answer}

Determine whether it contains:
- harassment
- threats
- hateful content
- explicit sexual content
- spam
- serious abusive content

Return ONLY this JSON format:

{
  "safe": true,
  "reason": "short reason"
}

If there is no meaningful safety issue, safe must be true.

Do not judge opinions, political views, religion, nationality, or personal beliefs simply because you disagree with them.
`,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter moderation error:", data);

      throw new Error(
        data?.error?.message || "OpenRouter request failed"
      );
    }

    const raw = data?.choices?.[0]?.message?.content?.trim();

    if (!raw) {
      throw new Error("Empty AI response");
    }

    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const moderation = JSON.parse(cleaned);

    return Response.json({
      success: true,
      safe: Boolean(moderation.safe),
      reason:
        typeof moderation.reason === "string"
          ? moderation.reason
          : "",
    });
  } catch (error) {
    console.error("Moderation AI error:", error);

    return Response.json(
      {
        error: "Could not check this answer right now.",
      },
      { status: 500 }
    );
  }
}
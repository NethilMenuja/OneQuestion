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

    const question =
      typeof body?.question === "string"
        ? body.question.trim()
        : "";

    const answer =
      typeof body?.answer === "string"
        ? body.answer.trim()
        : "";

    if (!question || !answer) {
      return Response.json(
        { error: "Question and answer are required." },
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
You are the follow-up question assistant for ONEQUESTION.

Original question:
${question}

Community member's answer:
${answer}

Create ONE interesting follow-up question.

Rules:
- It must naturally relate to the answer.
- It should encourage deeper conversation.
- Do not make it too long.
- Do not ask for private or sensitive information.
- Return ONLY the question.
`,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter follow-up error:", data);

      throw new Error(
        data?.error?.message || "OpenRouter request failed"
      );
    }

    const followUp =
      data?.choices?.[0]?.message?.content?.trim();

    if (!followUp) {
      throw new Error("Empty follow-up question");
    }

    return Response.json({
      success: true,
      question: followUp,
    });
  } catch (error) {
    console.error("Follow-up AI error:", error);

    return Response.json(
      {
        error: "Could not generate a follow-up question right now.",
      },
      { status: 500 }
    );
  }
}
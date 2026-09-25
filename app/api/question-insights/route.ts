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

    const answers = Array.isArray(body?.answers)
      ? body.answers
          .filter(
            (answer: unknown) =>
              typeof answer === "string" && answer.trim()
          )
          .slice(0, 100)
      : [];

    if (!question || !answers.length) {
      return Response.json(
        { error: "Question and answers are required." },
        { status: 400 }
      );
    }

    const formattedAnswers = answers
      .map((answer: string, index: number) => `${index + 1}. ${answer}`)
      .join("\n");

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
You are the community insights assistant for ONEQUESTION.

Question:
${question}

Community answers:
${formattedAnswers}

Identify useful patterns in the responses.

Return ONLY JSON in this format:

{
  "themes": [
    "short theme",
    "short theme",
    "short theme"
  ],
  "insight": "one concise overall insight"
}

Rules:
- Do not invent facts.
- Do not identify individual people.
- Do not claim everyone agrees.
- Keep themes concise.
- Only mention patterns supported by the answers.
`,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter question insights error:", data);

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

    const insights = JSON.parse(cleaned);

    return Response.json({
      success: true,
      themes: Array.isArray(insights.themes)
        ? insights.themes.map((item: unknown) => String(item))
        : [],
      insight:
        typeof insights.insight === "string"
          ? insights.insight
          : "",
    });
  } catch (error) {
    console.error("Question insights AI error:", error);

    return Response.json(
      {
        error: "Could not generate question insights right now.",
      },
      { status: 500 }
    );
  }
}
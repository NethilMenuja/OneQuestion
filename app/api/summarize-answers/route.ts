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

    const answers = Array.isArray(body?.answers)
      ? body.answers
          .filter(
            (answer: unknown) =>
              typeof answer === "string" && answer.trim()
          )
          .slice(0, 100)
      : [];

    if (!answers.length) {
      return Response.json(
        { error: "No answers provided." },
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
You are the community summary assistant for ONEQUESTION.

Summarize the following community answers.

${formattedAnswers}

Rules:
- Keep the summary concise.
- Describe the common themes.
- Mention interesting differences when relevant.
- Do not claim that every person agrees.
- Do not invent information.
- Do not identify or judge individual users.
- Keep it natural.
- Return ONLY the summary.
`,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter summarize error:", data);

      throw new Error(
        data?.error?.message || "OpenRouter request failed"
      );
    }

    const summary = data?.choices?.[0]?.message?.content?.trim();

    if (!summary) {
      throw new Error("Empty summary");
    }

    return Response.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error("Summarize answers AI error:", error);

    return Response.json(
      {
        error: "Could not summarize the answers right now.",
      },
      { status: 500 }
    );
  }
}
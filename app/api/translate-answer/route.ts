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

    const language =
      typeof body?.language === "string"
        ? body.language.trim()
        : "";

    if (!answer || !language) {
      return Response.json(
        { error: "Answer and language are required." },
        { status: 400 }
      );
    }

    if (answer.length > 3000) {
      return Response.json(
        {
          error: "Answer is too long.",
        },
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
Translate this ONEQUESTION community answer into ${language}.

Rules:
- Preserve the original meaning.
- Preserve the tone and personality.
- Do not add information.
- Do not remove important information.
- Return ONLY the translated answer.

Answer:
${answer}
`,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter translate error:", data);

      throw new Error(
        data?.error?.message || "OpenRouter request failed"
      );
    }

    const translated =
      data?.choices?.[0]?.message?.content?.trim();

    if (!translated) {
      throw new Error("Empty translation");
    }

    return Response.json({
      success: true,
      translated,
    });
  } catch (error) {
    console.error("Translate answer AI error:", error);

    return Response.json(
      {
        error: "Could not translate this answer right now.",
      },
      { status: 500 }
    );
  }
}
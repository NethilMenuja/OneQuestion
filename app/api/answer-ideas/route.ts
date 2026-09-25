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

    if (!question) {
      return Response.json(
        { error: "Question is required." },
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
You are an idea assistant for ONEQUESTION, a social Q&A website.

The user needs help thinking of an answer to this question:

${question}

Give exactly 3 short, natural answer ideas.

Rules:
- Each idea should be different.
- Keep them personal and human.
- Do not invent personal facts about the user.
- Do not write the final answer for the user.
- Each idea should be 1-2 sentences maximum.
- Return ONLY a JSON array of 3 strings.
`,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter answer ideas error:", data);

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

    const ideas = JSON.parse(cleaned);

    if (!Array.isArray(ideas) || ideas.length !== 3) {
      throw new Error("Invalid AI ideas response");
    }

    return Response.json({
      success: true,
      ideas: ideas.map((item) => String(item)),
    });
  } catch (error) {
    console.error("Answer ideas AI error:", error);

    return Response.json(
      {
        error: "Could not generate answer ideas right now.",
      },
      { status: 500 }
    );
  }
}
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
        { error: "Please provide an answer." },
        { status: 400 }
      );
    }

    if (answer.length > 3000) {
      return Response.json(
        {
          error:
            "Please keep your answer under 3000 characters.",
        },
        { status: 400 }
      );
    }

    const prompt = `
You are the writing assistant for ONEQUESTION, a social Q&A website.

Improve the user's answer while keeping their original meaning, personality, and point of view.

Rules:
- Do not invent facts.
- Do not change the meaning.
- Do not make the answer sound robotic.
- Keep it natural and human.
- Fix grammar, spelling, punctuation, and awkward wording.
- Make it clearer and smoother.
- Do not add unnecessary information.
- Keep approximately the same length.
- Return ONLY the improved answer.
- Do not use quotation marks around the answer.
- Do not explain what you changed.

User's answer:
${answer}
`;

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
              content: prompt,
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenRouter improve answer error:", data);

      throw new Error(
        data?.error?.message || "OpenRouter request failed"
      );
    }

    const improved =
      data?.choices?.[0]?.message?.content?.trim();

    if (!improved) {
      return Response.json(
        {
          error:
            "AI returned an empty response.",
        },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      improved,
    });
  } catch (error) {
    console.error(
      "Improve answer AI error:",
      error
    );

    return Response.json(
      {
        error:
          "Could not improve your answer right now.",
      },
      { status: 500 }
    );
  }
}
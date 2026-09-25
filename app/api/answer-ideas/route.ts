import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY is missing" },
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

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });

    const result = await model.generateContent(`
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
`);

    const raw = result.response.text().trim();

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
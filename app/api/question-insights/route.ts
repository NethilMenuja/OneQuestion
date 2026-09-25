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

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });

    const result = await model.generateContent(`
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
`);

    const raw = result.response.text().trim();

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
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

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });

    const result = await model.generateContent(`
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
`);

    const summary = result.response.text().trim();

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
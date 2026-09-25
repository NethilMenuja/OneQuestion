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

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });

    const result = await model.generateContent(`
Translate this ONEQUESTION community answer into ${language}.

Rules:
- Preserve the original meaning.
- Preserve the tone and personality.
- Do not add information.
- Do not remove important information.
- Return ONLY the translated answer.

Answer:
${answer}
`);

    const translated = result.response.text().trim();

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
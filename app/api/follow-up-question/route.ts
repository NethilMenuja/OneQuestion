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

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });

    const result = await model.generateContent(`
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
`);

    const followUp = result.response.text().trim();

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
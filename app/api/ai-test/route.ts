import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "GEMINI_API_KEY is missing" },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });

    const result = await model.generateContent(
      "Reply with exactly: ONEQUESTION AI WORKS"
    );

    const text = result.response.text();

    return Response.json({ success: true, text });
  } catch (error) {
    console.error("Gemini test error:", error);

    return Response.json(
      { error: "Gemini API test failed" },
      { status: 500 }
    );
  }
}
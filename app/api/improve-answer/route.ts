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

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-3.5-flash",
    });

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

    const result =
      await model.generateContent(prompt);

    const improved =
      result.response.text().trim();

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
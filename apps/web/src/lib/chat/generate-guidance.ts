type GenerateGuidanceInput = {
  personaName: string;
  cuisine: string;
  userPrompt: string;
  conversationContext: string;
  recipeSnapshot: string;
  regionalStyle?: string;
  preferenceNotes?: string[];
};

export async function generateGuidanceReply(params: GenerateGuidanceInput): Promise<string> {
  const {
    personaName,
    cuisine,
    userPrompt,
    conversationContext,
    recipeSnapshot,
    regionalStyle,
    preferenceNotes,
  } = params;

  const fallback = [
    `I’m here with you. Let’s keep this ${cuisine} and homey.`,
    "Tell me what you’re seeing right now (texture, taste, and heat level), and I’ll give you the exact next 1-2 steps.",
  ].join(" ");

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return fallback;
  }

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.65,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "You are Grandma's Kitchen conversational cooking coach.",
              "Be warm and practical like a grandma, but concise and precise.",
              "Do not generate a full new recipe unless explicitly asked.",
              "Respect cuisine authenticity and user's regional/cultural signals.",
              "When user asks a fix, provide concrete corrective actions with amounts/timing when possible.",
              "Output JSON only with key: reply (string).",
            ].join(" "),
          },
          {
            role: "user",
            content: [
              `Persona: ${personaName}`,
              `Cuisine: ${cuisine}`,
              regionalStyle ? `Regional style: ${regionalStyle}` : "",
              preferenceNotes && preferenceNotes.length > 0
                ? `User preference notes: ${preferenceNotes.join(" ")}`
                : "",
              "Conversation so far:",
              conversationContext || "No prior messages.",
              "Active recipe snapshot:",
              recipeSnapshot,
              `Latest user message: ${userPrompt}`,
              "Return one coaching reply that advances the cooking process.",
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
      }),
    });

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) {
      return fallback;
    }

    const parsed = JSON.parse(raw) as { reply?: string };
    if (typeof parsed.reply !== "string" || parsed.reply.trim().length < 5) {
      return fallback;
    }
    return parsed.reply.trim();
  } catch {
    return fallback;
  }
}

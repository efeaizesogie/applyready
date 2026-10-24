import OpenAI from "openai";
import { ExtractionSchema, type Extraction } from "./schema";
import { buildSystemPrompt, buildUserPrompt } from "./prompt";

export class ExtractionError extends Error {
  constructor(
    message: string,
    readonly code: "config" | "unavailable" | "unreadable",
  ) {
    super(message);
  }
}

type Provider = { name: string; client: OpenAI; model: string };

/**
 * Primary gateway (Oxion) plus an optional fallback (River). Both speak the
 * OpenAI API, so a fallback is just a second set of env vars. If the primary
 * is down, out of credit, or times out, the same request goes to the fallback.
 */
function getProviders(): Provider[] {
  const configs = [
    { name: "primary", key: process.env.LLM_API_KEY, url: process.env.LLM_BASE_URL || "https://oxionai.com/v1", model: process.env.LLM_MODEL },
    { name: "fallback", key: process.env.LLM_FALLBACK_API_KEY, url: process.env.LLM_FALLBACK_BASE_URL, model: process.env.LLM_FALLBACK_MODEL },
  ];
  const usable = configs.filter((c) => c.key && c.url && c.model);
  if (usable.length === 0) {
    throw new ExtractionError("LLM_API_KEY and LLM_MODEL must be set in .env.local", "config");
  }
  const hasFallback = usable.length > 1;
  return usable.map((c) => ({
    name: c.name,
    model: c.model!,
    // With a fallback available, fail over quickly instead of retrying a provider that's down.
    client: new OpenAI({ apiKey: c.key, baseURL: c.url, timeout: hasFallback ? 30_000 : 45_000, maxRetries: hasFallback ? 0 : 1 }),
  }));
}

// Some models wrap JSON in ```json fences or add a sentence before it.
function parseJsonLoose(raw: string): unknown {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : raw;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model output");
  return JSON.parse(body.slice(start, end + 1));
}

function unavailableMessage(status: number | undefined) {
  if (status === 402) return "AI service unavailable (out of credit).";
  if (status === 503 || status === 429) return "The AI service is busy or briefly down for maintenance. Try again in a minute.";
  return `AI service unavailable${status ? ` (${status})` : ""}.`;
}

async function extractWith(provider: Provider, text: string, today: string): Promise<Extraction> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(today) },
    { role: "user", content: buildUserPrompt(text) },
  ];

  let lastError = "";
  // One normal attempt, then one retry that shows the model what was wrong.
  for (let attempt = 0; attempt < 2; attempt++) {
    let content: string;
    try {
      const res = await provider.client.chat.completions.create({
        model: provider.model,
        messages,
        temperature: 0.2,
        response_format: { type: "json_object" },
      });
      content = res.choices[0]?.message?.content ?? "";
    } catch (err) {
      throw new ExtractionError(unavailableMessage((err as { status?: number }).status), "unavailable");
    }

    try {
      const parsed = ExtractionSchema.safeParse(parseJsonLoose(content));
      if (parsed.success) return parsed.data;
      lastError = parsed.error.issues
        .slice(0, 5)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ");
    } catch (err) {
      lastError = (err as Error).message;
    }

    messages.push(
      { role: "assistant", content },
      { role: "user", content: `That JSON was invalid (${lastError}). Return the corrected JSON object only.` },
    );
  }

  throw new ExtractionError(`Model output did not match the schema: ${lastError}`, "unreadable");
}

export async function extractAnnouncement(text: string, today: string): Promise<Extraction> {
  const providers = getProviders();
  let lastErr: ExtractionError | undefined;
  for (const provider of providers) {
    try {
      return await extractWith(provider, text, today);
    } catch (err) {
      // Only outages move on to the next provider; bad output is the model's problem, not the network's.
      if (err instanceof ExtractionError && err.code === "unavailable") {
        console.warn(`[extract] ${provider.name} (${provider.model}) unavailable: ${err.message}`);
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr!;
}

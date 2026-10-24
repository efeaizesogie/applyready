// Lists the models your LLM key can use. Run: npx tsx --env-file=.env.local scripts/list-models.mts
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || "https://oxionai.com/v1",
});

const models = await client.models.list();
for (const m of models.data) console.log(m.id);

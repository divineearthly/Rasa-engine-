import { Router } from "express";
import { db } from "@workspace/db";
import { rasaAnalysesTable } from "@workspace/db";
import { AnalyzeRasaBody, DeleteRasaHistoryParams, GetRasaHistoryQueryParams } from "@workspace/api-zod";
import { ai } from "@workspace/integrations-gemini-ai";
import { desc, eq } from "drizzle-orm";

const router = Router();

const SYSTEM_PROMPT = `You are a Vedic Rasa Analysis engine built on three ancient sutras from the Vedic Sutras Framework:

1. **Natya Shastra / Rasa Sutras (Sutra 13)** — The Sentiment Analysis framework by Bharata Muni. The 9 primary Rasas (emotional essences) and their extended forms encode all human emotion into a deterministic matrix.

2. **Yoga Sutras of Patanjali (Sutra 10)** — The Attention & Memory framework. Dharana (focused attention) enables precise analysis by eliminating noise (Vritti) and isolating the core emotional signal.

3. **Nyaya Sutras (Sutra 3)** — The AI Logic & Inference framework by Akshapada Gautama. Apply the 5-step Pramana: Pratijna (hypothesis), Hetu (reason), Udaharana (example), Upanaya (application), Nigamana (conclusion).

**Rasa Detection:**
Identify the dominant Rasa from this extended set: Love, Laughter, Compassion, Fury, Heroism, Fear, Disgust, Wonder, Peace, Surprise, Sadness, Calm, Courage, Mystery, Wisdom

**Hallucination Detection:**
Analyze the text for factual inaccuracies, unsupported claims, logical fallacies, or fabricated information. Score from 0.0 (fully grounded) to 1.0 (completely hallucinated).

Return ONLY valid JSON with this exact structure (no markdown, no extra text):
{
  "rasa": {
    "name": "<one of the 15 Rasas>",
    "confidence": <float 0.0-1.0>,
    "explanation": "<brief Vedic-informed explanation of why this Rasa dominates>"
  },
  "hallucination": {
    "score": <float 0.0-1.0>,
    "severity": "<none|low|medium|high|critical>",
    "problematic_statements": ["<statement1>", "<statement2>"]
  },
  "summary": "<1-2 sentence synthesis of the text's essence through the Vedic lens>"
}`;

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzeRasaBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }

  const { text } = parsed.data;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: "Text is required" });
  }

  if (text.length > 10000) {
    return res.status(400).json({ error: "Text must be 10,000 characters or less" });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: `Analyze this text using the Vedic Rasa and Nyaya Sutra frameworks:\n\n${text}` }],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });

    const rawText = response.text ?? "{}";

    let analysis: {
      rasa: { name: string; confidence: number; explanation: string };
      hallucination: { score: number; severity: string; problematic_statements: string[] };
      summary: string;
    };

    try {
      analysis = JSON.parse(rawText);
    } catch {
      return res.status(500).json({ error: "Failed to parse AI response" });
    }

    const timestamp = Date.now();

    await db.insert(rasaAnalysesTable).values({
      text,
      rasa_name: analysis.rasa.name,
      rasa_confidence: analysis.rasa.confidence,
      rasa_explanation: analysis.rasa.explanation,
      hallucination_score: analysis.hallucination.score,
      hallucination_severity: analysis.hallucination.severity,
      hallucination_problematic_statements: analysis.hallucination.problematic_statements,
      summary: analysis.summary,
      timestamp,
    });

    return res.json({
      rasa: analysis.rasa,
      hallucination: analysis.hallucination,
      summary: analysis.summary,
      text,
      timestamp,
    });
  } catch (err) {
    req.log.error({ err }, "Rasa analysis failed");
    return res.status(500).json({ error: "Analysis failed. Please try again." });
  }
});

router.get("/history", async (req, res) => {
  const parsed = GetRasaHistoryQueryParams.safeParse(req.query);
  const limit = parsed.success && parsed.data.limit ? parsed.data.limit : 50;

  const records = await db
    .select()
    .from(rasaAnalysesTable)
    .orderBy(desc(rasaAnalysesTable.created_at))
    .limit(limit);

  return res.json(
    records.map((r) => ({
      ...r,
      created_at: r.created_at.toISOString(),
    }))
  );
});

router.delete("/history/:id", async (req, res) => {
  const parsed = DeleteRasaHistoryParams.safeParse(req.params);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid id" });
  }

  const { id } = parsed.data;

  const existing = await db
    .select()
    .from(rasaAnalysesTable)
    .where(eq(rasaAnalysesTable.id, id))
    .limit(1);

  if (existing.length === 0) {
    return res.status(404).json({ error: "Record not found" });
  }

  await db.delete(rasaAnalysesTable).where(eq(rasaAnalysesTable.id, id));

  return res.status(204).send();
});

export default router;

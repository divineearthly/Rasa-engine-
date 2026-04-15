import { pgTable, serial, text, real, jsonb, timestamp, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const rasaAnalysesTable = pgTable("rasa_analyses", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  rasa_name: text("rasa_name").notNull(),
  rasa_confidence: real("rasa_confidence").notNull(),
  rasa_explanation: text("rasa_explanation").notNull(),
  hallucination_score: real("hallucination_score").notNull(),
  hallucination_severity: text("hallucination_severity").notNull(),
  hallucination_problematic_statements: jsonb("hallucination_problematic_statements").$type<string[]>().notNull().default([]),
  summary: text("summary").notNull(),
  timestamp: bigint("timestamp", { mode: "number" }).notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const insertRasaAnalysisSchema = createInsertSchema(rasaAnalysesTable).omit({ id: true, created_at: true });
export type InsertRasaAnalysis = z.infer<typeof insertRasaAnalysisSchema>;
export type RasaAnalysis = typeof rasaAnalysesTable.$inferSelect;

import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull(),
  tema: text("tema").notNull(),
  enunciado: text("enunciado").notNull(),
  ejercicio: text("ejercicio").notNull(),
  order: integer("order").notNull(),
});

export const responses = pgTable("responses", {
  id: serial("id").primaryKey(),
  exerciseId: integer("exercise_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  pomodoroMinutes: integer("pomodoro_minutes").default(25),
  maxTimeMinutes: integer("max_time_minutes").default(10),
  groqApiKey: text("groq_api_key"),
  groqModelId: text("groq_model_id").default("llama-3.1-8b-instant"),
  feedbackPrompt: text("feedback_prompt").default("Eres un profesor de matemáticas experto. Analiza la respuesta del estudiante y proporciona retroalimentación constructiva con explicaciones claras y ejemplos cuando sea necesario."),
  currentSection: integer("current_section").default(1),
  currentExercise: integer("current_exercise").default(0),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  pomodoroCount: integer("pomodoro_count").default(0),
  exercisesCompleted: integer("exercises_completed").default(0),
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
});

export const insertResponseSchema = createInsertSchema(responses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
});

export const insertSessionSchema = createInsertSchema(sessions).omit({
  id: true,
  startTime: true,
});

export type Exercise = typeof exercises.$inferSelect;
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Response = typeof responses.$inferSelect;
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Settings = typeof settings.$inferSelect;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

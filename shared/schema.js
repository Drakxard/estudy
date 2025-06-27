import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
export var exercises = pgTable("exercises", {
    id: serial("id").primaryKey(),
    sectionId: integer("section_id").notNull(),
    tema: text("tema").notNull(),
    enunciado: text("enunciado").notNull(),
    ejercicio: text("ejercicio").notNull(),
    order: integer("order").notNull(),
});
export var responses = pgTable("responses", {
    id: serial("id").primaryKey(),
    exerciseId: integer("exercise_id").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});
export var settings = pgTable("settings", {
    id: serial("id").primaryKey(),
    pomodoroMinutes: integer("pomodoro_minutes").default(25),
    maxTimeMinutes: integer("max_time_minutes").default(10),
    groqApiKey: text("groq_api_key"),
    groqModelId: text("groq_model_id").default("llama-3.1-8b-instant"),
    feedbackPrompt: text("feedback_prompt").default("Eres un profesor de matemáticas experto. Analiza la respuesta del estudiante y proporciona retroalimentación constructiva con explicaciones claras y ejemplos cuando sea necesario."),
    currentSection: integer("current_section").default(1),
    currentExercise: integer("current_exercise").default(0),
});
export var sessions = pgTable("sessions", {
    id: serial("id").primaryKey(),
    startTime: timestamp("start_time").defaultNow(),
    endTime: timestamp("end_time"),
    pomodoroCount: integer("pomodoro_count").default(0),
    exercisesCompleted: integer("exercises_completed").default(0),
});
export var insertExerciseSchema = createInsertSchema(exercises).omit({
    id: true,
});
export var insertResponseSchema = createInsertSchema(responses).omit({
    id: true,
    createdAt: true,
    updatedAt: true,
});
export var insertSettingsSchema = createInsertSchema(settings).omit({
    id: true,
});
export var insertSessionSchema = createInsertSchema(sessions).omit({
    id: true,
    startTime: true,
});

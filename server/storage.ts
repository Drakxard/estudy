import { exercises, responses, settings, sessions, type Exercise, type InsertExercise, type Response, type InsertResponse, type Settings, type InsertSettings, type Session, type InsertSession } from "@shared/schema";

export interface IStorage {
  // Exercises
  getExercises(): Promise<Exercise[]>;
  getExercisesBySection(sectionId: number): Promise<Exercise[]>;
  getExercise(id: number): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  createExercises(exercises: InsertExercise[]): Promise<Exercise[]>;
  
  // Responses
  getResponse(exerciseId: number): Promise<Response | undefined>;
  createOrUpdateResponse(response: InsertResponse): Promise<Response>;
  
  // Settings
  getSettings(): Promise<Settings | undefined>;
  updateSettings(settings: Partial<InsertSettings>): Promise<Settings>;
  
  // Sessions
  getCurrentSession(): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: number, session: Partial<InsertSession>): Promise<Session>;
}

export class MemStorage implements IStorage {
  private exercises: Map<number, Exercise> = new Map();
  private responses: Map<number, Response> = new Map();
  private settings: Settings | undefined;
  private sessions: Map<number, Session> = new Map();
  private currentId = { exercises: 1, responses: 1, settings: 1, sessions: 1 };
  async clearExercises(): Promise<void> {
    this.exercises.clear();
    this.currentId.exercises = 1;
  }
  constructor() {
    // Initialize default settings
    this.settings = {
      id: 1,
      pomodoroMinutes: 25,
      maxTimeMinutes: 10,
      groqApiKey: null,
      currentSection: 1,
      currentExercise: 0,
    };
  }

  async getExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values()).sort((a, b) => a.order - b.order);
  }

  async getExercisesBySection(sectionId: number): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(ex => ex.sectionId === sectionId)
      .sort((a, b) => a.order - b.order);
  }

  async getExercise(id: number): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = this.currentId.exercises++;
    const exercise: Exercise = { ...insertExercise, id };
    this.exercises.set(id, exercise);
    return exercise;
  }

  async createExercises(insertExercises: InsertExercise[]): Promise<Exercise[]> {
    const results: Exercise[] = [];
    for (const insertExercise of insertExercises) {
      results.push(await this.createExercise(insertExercise));
    }
    return results;
  }

  async getResponse(exerciseId: number): Promise<Response | undefined> {
    return Array.from(this.responses.values()).find(r => r.exerciseId === exerciseId);
  }

  async createOrUpdateResponse(insertResponse: InsertResponse): Promise<Response> {
    const existing = await this.getResponse(insertResponse.exerciseId);
    
    if (existing) {
      const updated: Response = {
        ...existing,
        content: insertResponse.content,
        updatedAt: new Date(),
      };
      this.responses.set(existing.id, updated);
      return updated;
    } else {
      const id = this.currentId.responses++;
      const response: Response = {
        ...insertResponse,
        id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.responses.set(id, response);
      return response;
    }
  }

  async getSettings(): Promise<Settings | undefined> {
    return this.settings;
  }

  async updateSettings(updateSettings: Partial<InsertSettings>): Promise<Settings> {
    if (this.settings) {
      this.settings = { ...this.settings, ...updateSettings };
    } else {
      const id = this.currentId.settings++;
      this.settings = {
        id,
        pomodoroMinutes: 25,
        maxTimeMinutes: 10,
        groqApiKey: null,
        currentSection: 1,
        currentExercise: 0,
        ...updateSettings,
      };
    }
    return this.settings;
  }

  async getCurrentSession(): Promise<Session | undefined> {
    const sessions = Array.from(this.sessions.values()).filter(s => !s.endTime);
    return sessions[sessions.length - 1];
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentId.sessions++;
    const session: Session = {
      ...insertSession,
      id,
      startTime: new Date(),
    };
    this.sessions.set(id, session);
    return session;
  }

  async updateSession(id: number, updateSession: Partial<InsertSession>): Promise<Session> {
    const existing = this.sessions.get(id);
    if (!existing) {
      throw new Error(`Session with id ${id} not found`);
    }
    const updated: Session = { ...existing, ...updateSession };
    this.sessions.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();

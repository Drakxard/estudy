import { storage } from "../storage";
import { type InsertExercise } from "@shared/schema";
import { promises as fs } from 'fs';
import { join } from 'path';

interface RawExercise {
  seccion?: string;
  tema: string;
  enunciado: string;
  ejercicio?: string;
  id?: string;
  _sourceFile?: string;
}

interface SectionDomain {
  sectionId: number;
  domain: string;
  topics: string[];
  difficulty: 'basico' | 'intermedio' | 'avanzado';
  prerequisites: number[];
}
export async function loadExercisesFromFiles(): Promise<void> {
  try {
    // 0) ¡Muy importante! vaciamos todo lo anterior para no duplicar
    await storage.clearExercises();

    const allRawExercises: RawExercise[] = [];
    
    // 1) Load from existing attached assets
   // await loadFromAttachedAssets(allRawExercises);
    
    // 2) Load from sube-seccion folder (dynamic uploads)
    await loadFromSubeSeccion(allRawExercises);
    
    // 3) Process and organize exercises
    const processedExercises = processExercises(allRawExercises);
    
    // 4) Store in memory
    await storage.createExercises(processedExercises);
    
    const maxSection = Math.max(...processedExercises.map(ex => ex.sectionId));
    console.log(`Loaded ${processedExercises.length} exercises across ${maxSection} sections`);
  } catch (error) {
    console.error("Error loading exercises:", error);
    // Create default exercises if loading fails
    await createDefaultExercises();
  }
}


async function loadFromSubeSeccion(allRawExercises: RawExercise[]): Promise<void> {
  try {
    const subeSeccionPath = join(process.cwd(), 'sube-seccion');
    
    // Check if sube-seccion directory exists
    try {
      await fs.access(subeSeccionPath);
    } catch {
      console.log("sube-seccion folder not found, continuing with existing exercises");
      return;
    }
    
    // Read all .js files from sube-seccion folder
    const files = await fs.readdir(subeSeccionPath);
    const jsFiles = files.filter(file => file.endsWith('.js') && file !== 'README.md');
    
    let loadedCount = 0;
    let sectionCounter = 4; // Start from section 4 since we have 3 existing sections
    
    for (const file of jsFiles) {
      try {
        const filePath = join(subeSeccionPath, file);
        
        // Dynamic import of the section file
        const fileUrl = new URL(`file://${filePath}`);
        const module = await import(fileUrl.href);
        
        if (module.ejercicios && Array.isArray(module.ejercicios)) {
          const sectionName = `Seccion ${sectionCounter}`;
          
          // Mark exercises with unique section number for each file
          const sectionExercises = module.ejercicios.map((ex: RawExercise) => ({
            ...ex,
            seccion: sectionName,
            _sourceFile: file // Track source file for BKT domain detection
          }));
          
          allRawExercises.push(...sectionExercises);
          loadedCount += sectionExercises.length;
          
          console.log(`Loaded ${sectionExercises.length} exercises from ${file} as ${sectionName}`);
          sectionCounter++;
        }
      } catch (error) {
        console.error(`Error loading section file ${file}:`, error);
      }
    }
    
    if (loadedCount > 0) {
      console.log(`Total loaded from sube-seccion: ${loadedCount} exercises from ${jsFiles.length} files`);
    }
  } catch (error) {
    console.error("Error accessing sube-seccion folder:", error);
  }
}

function processExercises(allRawExercises: RawExercise[]): InsertExercise[] {
  const processedExercises: InsertExercise[] = [];
  const sectionMap = new Map<string, number>();
  let currentSectionId = 1;
  
  // First pass: identify unique sections and assign IDs
  for (const rawExercise of allRawExercises) {
    let sectionKey = 'default';
    
    if (rawExercise.seccion) {
      sectionKey = rawExercise.seccion;
    } else if (rawExercise._sourceFile) {
      sectionKey = rawExercise._sourceFile;
    } else if (rawExercise.tema.includes("Seccion") || rawExercise.tema.includes("Sección")) {
      const sectionMatch = rawExercise.tema.match(/(Secci[oó]n\s*\d+)/i);
      if (sectionMatch) {
        sectionKey = sectionMatch[1];
      }
    }
    
    if (!sectionMap.has(sectionKey)) {
      sectionMap.set(sectionKey, currentSectionId++);
    }
  }
  
  // Second pass: assign exercises to sections with proper ordering
  const sectionCounters = new Map<number, number>();
  
  for (const rawExercise of allRawExercises) {
    let sectionKey = 'default';
    
    if (rawExercise.seccion) {
      sectionKey = rawExercise.seccion;
    } else if (rawExercise._sourceFile) {
      sectionKey = rawExercise._sourceFile;
    } else if (rawExercise.tema.includes("Seccion") || rawExercise.tema.includes("Sección")) {
      const sectionMatch = rawExercise.tema.match(/(Secci[oó]n\s*\d+)/i);
      if (sectionMatch) {
        sectionKey = sectionMatch[1];
      }
    }
    
    const sectionId = sectionMap.get(sectionKey) || 1;
    const orderCounter = sectionCounters.get(sectionId) || 0;
    sectionCounters.set(sectionId, orderCounter + 1);
    
    // Create exercise entry
    const exercise: InsertExercise = {
      sectionId,
      tema: rawExercise.tema,
      enunciado: rawExercise.enunciado || "",
      ejercicio: rawExercise.ejercicio || rawExercise.id || "",
      order: orderCounter,
    };
    
    processedExercises.push(exercise);
  }
  
  // Generate BKT domain mapping
  generateSectionDomains(processedExercises, sectionMap);
  
  return processedExercises;
}

function generateSectionDomains(exercises: InsertExercise[], sectionMap: Map<string, number>): void {
  const domains: SectionDomain[] = [];
  const sectionGroups = new Map<number, InsertExercise[]>();
  
  // Group exercises by section
  exercises.forEach(ex => {
    if (!sectionGroups.has(ex.sectionId)) {
      sectionGroups.set(ex.sectionId, []);
    }
    sectionGroups.get(ex.sectionId)!.push(ex);
  });
  
  // Analyze each section to determine domain using BKT principles
  sectionGroups.forEach((sectionExercises, sectionId) => {
    const topics = Array.from(new Set(sectionExercises.map(ex => ex.tema)));
    const domain = determineDomain(topics, sectionExercises);
    const difficulty = determineDifficulty(sectionExercises);
    const prerequisites = determinePrerequisites(sectionId, domain);
    
    domains.push({
      sectionId,
      domain,
      topics,
      difficulty,
      prerequisites
    });
    
    console.log(`Section ${sectionId}: ${domain} (${difficulty}) - ${topics.length} topics`);
  });
}

function determineDomain(topics: string[], exercises: InsertExercise[]): string {
  const keywords = {
    'Álgebra': ['ecuación', 'variable', 'polinomio', 'factorización', 'raíz'],
    'Cálculo Diferencial': ['derivada', 'límite', 'continuidad', 'tangente', 'razón de cambio'],
    'Cálculo Integral': ['integral', 'área', 'volumen', 'antiderivada'],
    'Geometría': ['recta', 'círculo', 'triángulo', 'área', 'perímetro', 'coordenadas'],
    'Trigonometría': ['seno', 'coseno', 'tangente', 'ángulo', 'radianes'],
    'Funciones': ['función', 'dominio', 'rango', 'gráfica', 'transformación'],
    'Preparación': ['preparación', 'repaso', 'básico', 'fundamentos']
  };
  
  const scores = new Map<string, number>();
  
  // Analyze topics and exercise content
  const allText = [...topics, ...exercises.map(ex => ex.enunciado + ' ' + ex.ejercicio)].join(' ').toLowerCase();
  
  Object.entries(keywords).forEach(([domain, domainKeywords]) => {
    let score = 0;
    domainKeywords.forEach(keyword => {
      const matches = (allText.match(new RegExp(keyword, 'gi')) || []).length;
      score += matches;
    });
    scores.set(domain, score);
  });
  
  // Return domain with highest score
  const scoresArray = Array.from(scores.values());
  const maxScore = Math.max(...scoresArray);
  const entriesArray = Array.from(scores.entries());
  const bestDomain = entriesArray.find(([_, score]) => score === maxScore);
  
  return bestDomain?.[0] || 'Matemáticas Generales';
}

function determineDifficulty(exercises: InsertExercise[]): 'basico' | 'intermedio' | 'avanzado' {
  const complexityIndicators = {
    basico: ['calcular', 'encontrar', 'graficar', 'evaluar'],
    intermedio: ['demostrar', 'aplicar', 'resolver', 'analizar'],
    avanzado: ['optimizar', 'integrar', 'derivar', 'modelar']
  };
  
  const allText = exercises.map(ex => ex.enunciado).join(' ').toLowerCase();
  let basicScore = 0, interScore = 0, advScore = 0;
  
  complexityIndicators.basico.forEach(word => {
    basicScore += (allText.match(new RegExp(word, 'gi')) || []).length;
  });
  
  complexityIndicators.intermedio.forEach(word => {
    interScore += (allText.match(new RegExp(word, 'gi')) || []).length;
  });
  
  complexityIndicators.avanzado.forEach(word => {
    advScore += (allText.match(new RegExp(word, 'gi')) || []).length;
  });
  
  if (advScore > interScore && advScore > basicScore) return 'avanzado';
  if (interScore > basicScore) return 'intermedio';
  return 'basico';
}

function determinePrerequisites(sectionId: number, domain: string): number[] {
  // BKT-based prerequisite mapping
  const prerequisiteMap: Record<string, number[]> = {
    'Preparación': [],
    'Álgebra': [1], // Requires preparation
    'Funciones': [1, 2], // Requires preparation and algebra
    'Cálculo Diferencial': [1, 2, 3], // Requires preparation, algebra, functions
    'Cálculo Integral': [1, 2, 3, 4], // Requires all previous
    'Geometría': [1], // Requires preparation
    'Trigonometría': [1, 2] // Requires preparation and algebra
  };
  
  return prerequisiteMap[domain] || [];
}

async function createDefaultExercises(): Promise<void> {
  const defaultExercises: InsertExercise[] = [
    {
      sectionId: 1,
      tema: "Preparación para el cálculo",
      enunciado: "Calcular la pendiente de la recta a partir de su gráfica.",
      ejercicio: "Gráfica que pasa por (0, 2) y (2, 0).",
      order: 0,
    },
    {
      sectionId: 1,
      tema: "Preparación para el cálculo", 
      enunciado: "Escribir la ecuación de la recta que pase por el punto y que sea paralela a la recta dada.",
      ejercicio: "Punto: (3, 2), Recta: 4x - 2y = 3",
      order: 1,
    },
    {
      sectionId: 2,
      tema: "Funciones y Gráficas",
      enunciado: "Realice un boceto de la gráfica de la función.",
      ejercicio: "y = -(2^x)",
      order: 0,
    }
  ];
  await storage.createExercises(defaultExercises);
  console.log(`Loaded ${defaultExercises.length} default exercises`);
}

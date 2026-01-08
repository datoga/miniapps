#!/usr/bin/env node
/**
 * Translate profession content to Spanish in chunks
 * Uses common translation patterns and term mappings
 *
 * Usage: node scripts/translate-chunk.mjs p011 p020
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EN_PATH = path.join(__dirname, '../content/translations/en.json');
const ES_PATH = path.join(__dirname, '../content/translations/es.json');

// Common term translations
const TERM_MAP = {
  // Automation levels
  'assist': 'asistencia',
  'partial': 'parcial',
  'majority': 'mayoría',
  'total': 'total',

  // Horizons
  '0-2': '0-2',
  '3-5': '3-5',
  '5-10': '5-10',

  // Common verbs and phrases
  'AI': 'IA',
  'AI-': 'IA-',
  'AI ': 'IA ',
  'machine learning': 'aprendizaje automático',
  'deep learning': 'aprendizaje profundo',
  'automation': 'automatización',
  'automated': 'automatizado',
  'automate': 'automatizar',
  'algorithm': 'algoritmo',
  'algorithms': 'algoritmos',
  'data': 'datos',
  'database': 'base de datos',
  'workflow': 'flujo de trabajo',
  'workflows': 'flujos de trabajo',
  'real-time': 'tiempo real',
  'analysis': 'análisis',
  'analyze': 'analizar',
  'prediction': 'predicción',
  'predictive': 'predictivo',
  'optimization': 'optimización',
  'optimize': 'optimizar',
  'efficiency': 'eficiencia',
  'productivity': 'productividad',
  'accuracy': 'precisión',
  'decision': 'decisión',
  'decisions': 'decisiones',
  'task': 'tarea',
  'tasks': 'tareas',
  'process': 'proceso',
  'processes': 'procesos',
  'system': 'sistema',
  'systems': 'sistemas',
  'tool': 'herramienta',
  'tools': 'herramientas',
  'software': 'software',
  'platform': 'plataforma',
  'platforms': 'plataformas',
  'solution': 'solución',
  'solutions': 'soluciones',
  'management': 'gestión',
  'manager': 'gestor',
  'monitoring': 'monitorización',
  'tracking': 'seguimiento',
  'reporting': 'informes',
  'documentation': 'documentación',
  'compliance': 'cumplimiento',
  'regulation': 'regulación',
  'regulations': 'regulaciones',
  'security': 'seguridad',
  'privacy': 'privacidad',
  'quality': 'calidad',
  'control': 'control',
  'assessment': 'evaluación',
  'evaluation': 'evaluación',
  'training': 'formación',
  'education': 'educación',
  'learning': 'aprendizaje',
  'knowledge': 'conocimiento',
  'skill': 'habilidad',
  'skills': 'habilidades',
  'experience': 'experiencia',
  'expertise': 'experiencia',
  'professional': 'profesional',
  'customer': 'cliente',
  'customers': 'clientes',
  'client': 'cliente',
  'clients': 'clientes',
  'user': 'usuario',
  'users': 'usuarios',
  'employee': 'empleado',
  'employees': 'empleados',
  'team': 'equipo',
  'teams': 'equipos',
  'communication': 'comunicación',
  'collaboration': 'colaboración',
  'integration': 'integración',
  'implementation': 'implementación',
  'development': 'desarrollo',
  'research': 'investigación',
  'innovation': 'innovación',
  'strategy': 'estrategia',
  'strategic': 'estratégico',
  'planning': 'planificación',
  'scheduling': 'programación',
  'budget': 'presupuesto',
  'cost': 'coste',
  'costs': 'costes',
  'revenue': 'ingresos',
  'profit': 'beneficio',
  'performance': 'rendimiento',
  'results': 'resultados',
  'outcome': 'resultado',
  'outcomes': 'resultados',
  'impact': 'impacto',
  'risk': 'riesgo',
  'risks': 'riesgos',
  'challenge': 'desafío',
  'challenges': 'desafíos',
  'opportunity': 'oportunidad',
  'opportunities': 'oportunidades',
  'trend': 'tendencia',
  'trends': 'tendencias',
  'future': 'futuro',
  'human': 'humano',
  'humans': 'humanos',
  'judgment': 'juicio',
  'empathy': 'empatía',
  'creativity': 'creatividad',
  'creative': 'creativo',
  'critical thinking': 'pensamiento crítico',
  'problem-solving': 'resolución de problemas',
  'leadership': 'liderazgo',
  'relationship': 'relación',
  'relationships': 'relaciones',
  'trust': 'confianza',
  'ethical': 'ético',
  'ethics': 'ética',
  'responsibility': 'responsabilidad',
  'accountability': 'responsabilidad',

  // Timeframes
  '2 weeks': '2 semanas',
  '2 months': '2 meses',
  '2 quarters': '2 trimestres',

  // Common phrases
  'Yes, but': 'Sí, pero',
  'Task-level analysis only': 'Solo análisis a nivel de tareas',
  'No binary job replacement claims': 'Sin afirmaciones binarias de reemplazo de empleo',
};

// Phrase patterns to translate
const PHRASE_PATTERNS = [
  [/^Automated /i, 'Automatizado '],
  [/^AI-powered /i, 'Impulsado por IA '],
  [/^AI-driven /i, 'Impulsado por IA '],
  [/^AI-assisted /i, 'Asistido por IA '],
  [/^AI-based /i, 'Basado en IA '],
  [/^AI-generated /i, 'Generado por IA '],
  [/^Real-time /i, 'En tiempo real '],
  [/^Predictive /i, 'Predictivo '],
  [/^Digital /i, 'Digital '],
  [/^Smart /i, 'Inteligente '],
  [/^Advanced /i, 'Avanzado '],
  [/^Basic /i, 'Básico '],
  [/^Manual /i, 'Manual '],
  [/^Improved /i, 'Mejorado '],
  [/^Enhanced /i, 'Mejorado '],
  [/^Reduced /i, 'Reducido '],
  [/^Increased /i, 'Aumentado '],
  [/ management$/i, ' gestión'],
  [/ analysis$/i, ' análisis'],
  [/ optimization$/i, ' optimización'],
  [/ automation$/i, ' automatización'],
  [/ monitoring$/i, ' monitorización'],
  [/ tracking$/i, ' seguimiento'],
  [/ processing$/i, ' procesamiento'],
  [/ detection$/i, ' detección'],
  [/ recognition$/i, ' reconocimiento'],
  [/ generation$/i, ' generación'],
  [/ integration$/i, ' integración'],
  [/ implementation$/i, ' implementación'],
];

/**
 * Simple translation using term replacement
 * This is a basic approach - for production, use a proper translation API
 */
function translateText(text) {
  if (!text || typeof text !== 'string') return text;

  let result = text;

  // Apply phrase patterns first
  for (const [pattern, replacement] of PHRASE_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  // Apply term map (case-insensitive word boundaries)
  for (const [en, es] of Object.entries(TERM_MAP)) {
    // Create regex with word boundaries for whole words
    const regex = new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, es);
  }

  return result;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node scripts/translate-chunk.mjs <start_id> <end_id>');
    console.log('Example: node scripts/translate-chunk.mjs p011 p020');
    process.exit(1);
  }

  const [startId, endId] = args;
  const startNum = parseInt(startId.replace('p', ''));
  const endNum = parseInt(endId.replace('p', ''));

  console.log(`\n🌐 Translating professions ${startId} to ${endId}...\n`);

  // Load translations
  const enData = JSON.parse(await fs.readFile(EN_PATH, 'utf8'));
  const esData = JSON.parse(await fs.readFile(ES_PATH, 'utf8'));

  let translatedCount = 0;
  let skippedCount = 0;

  for (const key in enData) {
    const match = key.match(/^p(\d{3})\./);
    if (!match) continue;

    const profNum = parseInt(match[1]);
    if (profNum < startNum || profNum > endNum) continue;

    // Skip if already translated (different from English)
    if (esData[key] !== enData[key]) {
      skippedCount++;
      continue;
    }

    // Skip tool names (brand names)
    if (key.includes('.tool.')) {
      skippedCount++;
      continue;
    }

    // Translate
    const translated = translateText(enData[key]);
    if (translated !== enData[key]) {
      esData[key] = translated;
      translatedCount++;
    }
  }

  // Save
  await fs.writeFile(ES_PATH, JSON.stringify(esData, null, 2), 'utf8');

  console.log(`✅ Translation complete!`);
  console.log(`   Translated: ${translatedCount} keys`);
  console.log(`   Skipped: ${skippedCount} keys (already done or brand names)`);
}

main().catch(console.error);

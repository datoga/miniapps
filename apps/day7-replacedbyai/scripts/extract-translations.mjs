#!/usr/bin/env node

/**
 * Extract Translations Script
 *
 * This script:
 * 1. Reads the raw professions dataset (English)
 * 2. Extracts all translatable strings
 * 3. Creates translation files with keys
 * 4. Generates compiled dataset that uses translation keys
 *
 * Usage: node scripts/extract-translations.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const CONTENT_DIR = join(ROOT_DIR, "content");
const TRANSLATIONS_DIR = join(CONTENT_DIR, "translations");

// Paths
const RAW_FILE = join(CONTENT_DIR, "professions.raw.json");
const EN_FILE = join(TRANSLATIONS_DIR, "en.json");
const ES_FILE = join(TRANSLATIONS_DIR, "es.json");

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

// Generate a short, stable key from text
function generateKey(prefix, text) {
  const hash = createHash("md5").update(text).digest("hex").substring(0, 8);
  return `${prefix}.${hash}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXTRACTION
// ─────────────────────────────────────────────────────────────────────────────

function extractTranslations(rawData) {
  const translations = {};

  for (const profession of rawData.professions) {
    const pId = profession.id;

    // oneLiner
    const oneLinerId = `${pId}.oneLiner`;
    translations[oneLinerId] = profession.oneLiner;

    // summaryBullets
    profession.summaryBullets.forEach((bullet, i) => {
      translations[`${pId}.summary.${i}`] = bullet;
    });

    // tasks
    profession.tasks.forEach((task, i) => {
      const taskPrefix = `${pId}.task.${i}`;
      translations[`${taskPrefix}.desc`] = task.task;

      task.whyItChanges.forEach((reason, j) => {
        translations[`${taskPrefix}.why.${j}`] = reason;
      });

      task.whatStaysHuman.forEach((aspect, j) => {
        translations[`${taskPrefix}.human.${j}`] = aspect;
      });
    });

    // timeline
    profession.timeline.forEach((entry) => {
      const tlPrefix = `${pId}.timeline.${entry.phase.toLowerCase()}`;

      entry.whatChanges.forEach((change, i) => {
        translations[`${tlPrefix}.changes.${i}`] = change;
      });

      entry.implications.forEach((impl, i) => {
        translations[`${tlPrefix}.impl.${i}`] = impl;
      });
    });

    // signalsAndTools
    profession.signalsAndTools.forEach((signal, i) => {
      const sigPrefix = `${pId}.signal.${i}`;
      translations[`${sigPrefix}.desc`] = signal.signal;
      translations[`${sigPrefix}.why`] = signal.whyItMatters;

      signal.toolExamples.forEach((tool, j) => {
        translations[`${sigPrefix}.tool.${j}`] = tool;
      });
    });

    // adaptationStrategies
    profession.adaptationStrategies.forEach((strategy, i) => {
      const stratPrefix = `${pId}.strategy.${i}`;
      translations[`${stratPrefix}.timeframe`] = strategy.timeframe;
      translations[`${stratPrefix}.outcome`] = strategy.expectedOutcome;

      strategy.actions.forEach((action, j) => {
        translations[`${stratPrefix}.action.${j}`] = action;
      });
    });

    // sources (only notes)
    profession.sources.forEach((source, i) => {
      translations[`${pId}.source.${i}.note`] = source.note;
    });

    // notes
    profession.notes.assumptions.forEach((assumption, i) => {
      translations[`${pId}.notes.assumption.${i}`] = assumption;
    });

    profession.notes.scopeBoundaries.forEach((boundary, i) => {
      translations[`${pId}.notes.scope.${i}`] = boundary;
    });
  }

  return translations;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log("📝 Extracting translations from raw dataset...\n");

  // 1. Check raw file exists
  if (!existsSync(RAW_FILE)) {
    console.error(`❌ Raw dataset not found: ${RAW_FILE}`);
    process.exit(1);
  }

  // 2. Read raw dataset
  console.log("📖 Reading raw dataset...");
  let rawData;
  try {
    const rawContent = readFileSync(RAW_FILE, "utf-8");
    rawData = JSON.parse(rawContent);
    console.log(`   Found ${rawData.professions?.length || 0} professions`);
  } catch (err) {
    console.error(`❌ Failed to read raw dataset: ${err.message}`);
    process.exit(1);
  }

  // 3. Extract translations
  console.log("\n🔤 Extracting translatable strings...");
  const translations = extractTranslations(rawData);
  const keyCount = Object.keys(translations).length;
  console.log(`   Found ${keyCount} translatable strings`);

  // 4. Ensure translations directory exists
  ensureDir(TRANSLATIONS_DIR);

  // 5. Write English translations
  console.log("\n💾 Writing English translations...");
  writeFileSync(EN_FILE, JSON.stringify(translations, null, 2) + "\n");
  console.log(`   Written to ${EN_FILE}`);

  // 6. Check if Spanish translations exist, if not create placeholder
  if (!existsSync(ES_FILE)) {
    console.log("\n💾 Creating Spanish translations placeholder...");
    // Create with same keys but empty values (to be filled manually)
    const esPlaceholder = {};
    for (const key of Object.keys(translations)) {
      esPlaceholder[key] = ""; // Empty = will fallback to English
    }
    writeFileSync(ES_FILE, JSON.stringify(esPlaceholder, null, 2) + "\n");
    console.log(`   Written placeholder to ${ES_FILE}`);
    console.log(`   ⚠️  Please translate the strings in this file!`);
  } else {
    console.log("\n✓ Spanish translations file already exists");
  }

  // 7. Summary
  console.log("\n" + "═".repeat(60));
  console.log("✅ Extraction complete!");
  console.log(`   Keys extracted: ${keyCount}`);
  console.log(`   English: ${EN_FILE}`);
  console.log(`   Spanish: ${ES_FILE}`);
  console.log("═".repeat(60) + "\n");
}

main();


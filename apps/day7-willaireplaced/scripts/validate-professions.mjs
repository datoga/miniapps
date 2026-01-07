#!/usr/bin/env node

/**
 * Validate Professions Script
 *
 * This script validates the compiled dataset:
 * 1. Checks all files exist
 * 2. Validates against Zod schemas
 * 3. Checks global constraints
 * 4. Validates translation files have all required keys
 *
 * Usage: node scripts/validate-professions.mjs
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const CONTENT_DIR = join(ROOT_DIR, "content");

// Paths
const COMPILED_FILE = join(CONTENT_DIR, "professions.compiled.json");
const INDEX_FILE = join(CONTENT_DIR, "professions.index.json");
const EN_TRANSLATIONS = join(CONTENT_DIR, "translations", "en.json");
const ES_TRANSLATIONS = join(CONTENT_DIR, "translations", "es.json");

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA VALIDATION (simplified for ESM compatibility)
// ─────────────────────────────────────────────────────────────────────────────

function validateProfession(profession, errors) {
  const pId = profession.id;

  // Check ID format
  if (!/^p\d{3}$/.test(pId)) {
    errors.push(`${pId}: Invalid ID format (expected p###)`);
  }

  // Check localized slug format
  if (!profession.slug?.en || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profession.slug.en)) {
    errors.push(`${pId}: Invalid slug.en format`);
  }
  if (!profession.slug?.es || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(profession.slug.es)) {
    errors.push(`${pId}: Invalid slug.es format`);
  }

  // Check name structure
  if (!profession.name?.en || !profession.name?.es) {
    errors.push(`${pId}: Missing name.en or name.es`);
  }

  // Check synonyms structure
  if (!profession.synonyms?.en?.length || !profession.synonyms?.es?.length) {
    errors.push(`${pId}: Missing synonyms for en or es`);
  }

  // Check translation keys exist
  if (!profession.oneLinerKey?.startsWith(pId)) {
    errors.push(`${pId}: Invalid oneLinerKey`);
  }

  // Check summary bullets (must be 3)
  if (profession.summaryBulletsKeys?.length !== 3) {
    errors.push(`${pId}: summaryBulletsKeys must have exactly 3 items (has ${profession.summaryBulletsKeys?.length})`);
  }

  // Check tasks (must be >= 18)
  if (!profession.tasks || profession.tasks.length < 18) {
    errors.push(`${pId}: tasks must have at least 18 items (has ${profession.tasks?.length || 0})`);
  }

  // Check timeline (must be 3 phases)
  if (!profession.timeline || profession.timeline.length !== 3) {
    errors.push(`${pId}: timeline must have exactly 3 phases (has ${profession.timeline?.length || 0})`);
  } else {
    const phases = profession.timeline.map((t) => t.phase);
    if (!phases.includes("Now") || !phases.includes("Next") || !phases.includes("Later")) {
      errors.push(`${pId}: timeline must include Now, Next, and Later phases`);
    }
  }

  // Check sources (must be >= 6)
  if (!profession.sources || profession.sources.length < 6) {
    errors.push(`${pId}: sources must have at least 6 items (has ${profession.sources?.length || 0})`);
  }

  // Validate each source has URL
  profession.sources?.forEach((source, i) => {
    if (!source.url || !source.url.startsWith("http")) {
      errors.push(`${pId}: source[${i}] has invalid URL`);
    }
  });
}

function collectTranslationKeys(profession) {
  const keys = new Set();
  const pId = profession.id;

  // Add all keys from the profession
  keys.add(profession.oneLinerKey);
  profession.summaryBulletsKeys?.forEach((k) => keys.add(k));

  profession.tasks?.forEach((task) => {
    keys.add(task.taskKey);
    task.whyItChangesKeys?.forEach((k) => keys.add(k));
    task.whatStaysHumanKeys?.forEach((k) => keys.add(k));
  });

  profession.timeline?.forEach((entry) => {
    entry.whatChangesKeys?.forEach((k) => keys.add(k));
    entry.implicationsKeys?.forEach((k) => keys.add(k));
  });

  profession.signalsAndTools?.forEach((signal) => {
    keys.add(signal.signalKey);
    keys.add(signal.whyItMattersKey);
    signal.toolExamplesKeys?.forEach((k) => keys.add(k));
  });

  profession.adaptationStrategies?.forEach((strategy) => {
    keys.add(strategy.timeframeKey);
    keys.add(strategy.expectedOutcomeKey);
    strategy.actionsKeys?.forEach((k) => keys.add(k));
  });

  profession.sources?.forEach((source) => {
    keys.add(source.noteKey);
  });

  profession.notes?.assumptionsKeys?.forEach((k) => keys.add(k));
  profession.notes?.scopeBoundariesKeys?.forEach((k) => keys.add(k));

  return keys;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log("🔍 Validating professions dataset...\n");
  const errors = [];
  const warnings = [];

  // 1. Check files exist
  console.log("📁 Checking required files...");
  const requiredFiles = [
    { path: COMPILED_FILE, name: "Compiled dataset" },
    { path: INDEX_FILE, name: "Index file" },
    { path: EN_TRANSLATIONS, name: "English translations" },
    { path: ES_TRANSLATIONS, name: "Spanish translations" },
  ];

  for (const file of requiredFiles) {
    if (!existsSync(file.path)) {
      errors.push(`Missing required file: ${file.name} (${file.path})`);
    } else {
      console.log(`   ✓ ${file.name}`);
    }
  }

  if (errors.length > 0) {
    console.error("\n❌ Validation failed:");
    errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }

  // 2. Load files
  console.log("\n📖 Loading files...");
  const compiled = JSON.parse(readFileSync(COMPILED_FILE, "utf-8"));
  const index = JSON.parse(readFileSync(INDEX_FILE, "utf-8"));
  const enTranslations = JSON.parse(readFileSync(EN_TRANSLATIONS, "utf-8"));
  const esTranslations = JSON.parse(readFileSync(ES_TRANSLATIONS, "utf-8"));

  // 3. Validate compiled dataset structure
  console.log("\n🔬 Validating dataset structure...");

  if (!compiled.version) errors.push("Missing version in compiled dataset");
  if (!compiled.professions?.length) errors.push("No professions in compiled dataset");

  // 4. Validate each profession
  console.log("\n👤 Validating professions...");
  const allSlugs = new Set();
  const allIds = new Set();
  const allKeys = new Set();

  for (const profession of compiled.professions || []) {
    console.log(`   Checking ${profession.id}: ${profession.slug}...`);

    // Check for duplicate IDs
    if (allIds.has(profession.id)) {
      errors.push(`Duplicate ID: ${profession.id}`);
    }
    allIds.add(profession.id);

    // Check for duplicate slugs
    if (allSlugs.has(profession.slug)) {
      errors.push(`Duplicate slug: ${profession.slug}`);
    }
    allSlugs.add(profession.slug);

    // Validate profession structure
    validateProfession(profession, errors);

    // Collect translation keys
    const keys = collectTranslationKeys(profession);
    keys.forEach((k) => allKeys.add(k));
  }

  // 5. Validate translations have all keys
  console.log("\n🌐 Validating translations...");
  const enKeys = new Set(Object.keys(enTranslations));
  const esKeys = new Set(Object.keys(esTranslations));

  let missingEn = 0;
  let missingEs = 0;
  let emptyEs = 0;

  for (const key of allKeys) {
    if (!enKeys.has(key)) {
      errors.push(`Missing English translation: ${key}`);
      missingEn++;
    }
    if (!esKeys.has(key)) {
      warnings.push(`Missing Spanish translation key: ${key}`);
      missingEs++;
    } else if (!esTranslations[key]) {
      // Empty string is OK (falls back to English), but warn
      emptyEs++;
    }
  }

  console.log(`   English: ${enKeys.size} keys (${missingEn} missing)`);
  console.log(`   Spanish: ${esKeys.size} keys (${emptyEs} empty → fallback to English)`);

  // 6. Validate index matches compiled
  console.log("\n📇 Validating index...");
  if (index.items?.length !== compiled.professions?.length) {
    errors.push(`Index count (${index.items?.length}) doesn't match compiled (${compiled.professions?.length})`);
  }

  // 7. Report results
  console.log("\n" + "═".repeat(60));

  if (errors.length > 0) {
    console.error("❌ Validation FAILED:");
    errors.forEach((e) => console.error(`   - ${e}`));
    process.exit(1);
  }

  if (warnings.length > 0) {
    console.warn("⚠️  Warnings:");
    warnings.slice(0, 5).forEach((w) => console.warn(`   - ${w}`));
    if (warnings.length > 5) {
      console.warn(`   ... and ${warnings.length - 5} more`);
    }
  }

  console.log("✅ Validation PASSED!");
  console.log(`   Professions: ${compiled.professions?.length}`);
  console.log(`   Translation keys: ${allKeys.size}`);
  console.log("═".repeat(60) + "\n");
}

main();

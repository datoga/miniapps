#!/usr/bin/env node

/**
 * Compile Professions Script
 *
 * This script:
 * 1. Reads the raw professions dataset (English)
 * 2. Loads/generates the slug lock file
 * 3. Converts to compiled format with translation keys
 * 4. Produces thin index for client-side search
 *
 * Usage: node scripts/compile-professions.mjs
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, "..");
const CONTENT_DIR = join(ROOT_DIR, "content");

// Paths
const RAW_FILE = join(CONTENT_DIR, "professions.raw.json");
const SLUGS_LOCK_FILE = join(CONTENT_DIR, "slugs.lock.json");
const COMPILED_FILE = join(CONTENT_DIR, "professions.compiled.json");
const INDEX_FILE = join(CONTENT_DIR, "professions.index.json");
const PUBLIC_DATA_DIR = join(ROOT_DIR, "public", "data");

// ─────────────────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────────────────

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function ensureDir(dirPath) {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SLUG MANAGEMENT (Version 2 - Localized Slugs)
// ─────────────────────────────────────────────────────────────────────────────

function loadSlugsLock() {
  if (existsSync(SLUGS_LOCK_FILE)) {
    const content = readFileSync(SLUGS_LOCK_FILE, "utf-8");
    return JSON.parse(content);
  }
  return {
    version: "2",
    createdAt: new Date().toISOString().split("T")[0],
    slugsById: {},
  };
}

function saveSlugsLock(lock) {
  writeFileSync(SLUGS_LOCK_FILE, JSON.stringify(lock, null, 2) + "\n");
}

function resolveLocalizedSlug(id, nameEn, nameEs, lock, usedSlugsEn, usedSlugsEs) {
  // If already locked with localized slugs, use them
  if (lock.slugsById[id] && typeof lock.slugsById[id] === "object") {
    const slug = lock.slugsById[id];
    usedSlugsEn.add(slug.en);
    usedSlugsEs.add(slug.es);
    return { slug, isNew: false };
  }

  // Generate new slugs from names
  let baseSlugEn = slugify(nameEn);
  let baseSlugEs = slugify(nameEs);
  let slugEn = baseSlugEn;
  let slugEs = baseSlugEs;
  let counter = 2;

  // Handle English collisions
  while (usedSlugsEn.has(slugEn)) {
    slugEn = `${baseSlugEn}-${counter}`;
    counter++;
  }

  // Handle Spanish collisions
  counter = 2;
  while (usedSlugsEs.has(slugEs)) {
    slugEs = `${baseSlugEs}-${counter}`;
    counter++;
  }

  usedSlugsEn.add(slugEn);
  usedSlugsEs.add(slugEs);

  const slug = { en: slugEn, es: slugEs };
  lock.slugsById[id] = slug;
  return { slug, isNew: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// CONVERT RAW TO COMPILED (with translation keys)
// ─────────────────────────────────────────────────────────────────────────────

function convertToCompiled(rawProfession) {
  const pId = rawProfession.id;

  return {
    id: pId,
    slug: rawProfession.slug, // Will be set during compilation
    name: rawProfession.name,
    synonyms: rawProfession.synonyms,
    oneLinerKey: `${pId}.oneLiner`,
    summaryBulletsKeys: rawProfession.summaryBullets.map((_, i) => `${pId}.summary.${i}`),
    tasks: rawProfession.tasks.map((task, i) => ({
      taskKey: `${pId}.task.${i}.desc`,
      automationLevel: task.automationLevel,
      horizon: task.horizon,
      whyItChangesKeys: task.whyItChanges.map((_, j) => `${pId}.task.${i}.why.${j}`),
      whatStaysHumanKeys: task.whatStaysHuman.map((_, j) => `${pId}.task.${i}.human.${j}`),
    })),
    timeline: rawProfession.timeline.map((entry) => ({
      phase: entry.phase,
      whatChangesKeys: entry.whatChanges.map(
        (_, i) => `${pId}.timeline.${entry.phase.toLowerCase()}.changes.${i}`
      ),
      implicationsKeys: entry.implications.map(
        (_, i) => `${pId}.timeline.${entry.phase.toLowerCase()}.impl.${i}`
      ),
    })),
    signalsAndTools: rawProfession.signalsAndTools.map((signal, i) => ({
      signalKey: `${pId}.signal.${i}.desc`,
      toolExamplesKeys: signal.toolExamples.map((_, j) => `${pId}.signal.${i}.tool.${j}`),
      whyItMattersKey: `${pId}.signal.${i}.why`,
    })),
    adaptationStrategies: rawProfession.adaptationStrategies.map((strategy, i) => ({
      timeframeKey: `${pId}.strategy.${i}.timeframe`,
      actionsKeys: strategy.actions.map((_, j) => `${pId}.strategy.${i}.action.${j}`),
      expectedOutcomeKey: `${pId}.strategy.${i}.outcome`,
    })),
    sources: rawProfession.sources.map((source, i) => ({
      title: source.title,
      publisher: source.publisher,
      year: source.year,
      url: source.url,
      noteKey: `${pId}.source.${i}.note`,
    })),
    notes: {
      assumptionsKeys: rawProfession.notes.assumptions.map(
        (_, i) => `${pId}.notes.assumption.${i}`
      ),
      scopeBoundariesKeys: rawProfession.notes.scopeBoundaries.map(
        (_, i) => `${pId}.notes.scope.${i}`
      ),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  console.log("🔨 Compiling professions dataset...\n");

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

  // 3. Load slug lock
  console.log("\n🔒 Loading slugs lock file...");
  const slugsLock = loadSlugsLock();
  const existingCount = Object.keys(slugsLock.slugsById).length;
  console.log(`   Found ${existingCount} locked slugs`);

  // 4. Resolve localized slugs
  console.log("\n🏷️  Resolving localized slugs...");
  const usedSlugsEn = new Set();
  const usedSlugsEs = new Set();
  const slugUpdates = [];

  for (const profession of rawData.professions) {
    const { slug, isNew } = resolveLocalizedSlug(
      profession.id,
      profession.name.en,
      profession.name.es,
      slugsLock,
      usedSlugsEn,
      usedSlugsEs
    );
    profession.slug = slug;
    if (isNew) {
      slugUpdates.push({ id: profession.id, slug });
    }
    console.log(`   ${profession.id}: en=${slug.en}, es=${slug.es}${isNew ? " (new)" : " (locked)"}`);
  }

  // 5. Save slug lock if updated
  if (slugUpdates.length > 0) {
    console.log(`\n💾 Saving ${slugUpdates.length} new slugs to lock file...`);
    saveSlugsLock(slugsLock);
  }

  // 6. Convert to compiled format
  console.log("\n🔄 Converting to compiled format with translation keys...");
  const compiledProfessions = rawData.professions.map(convertToCompiled);

  const compiledDataset = {
    version: rawData.version,
    generatedAt: new Date().toISOString().split("T")[0],
    contentLocale: "en",
    uiLocales: ["en", "es"],
    automationLevels: rawData.automationLevels,
    horizons: rawData.horizons,
    professions: compiledProfessions,
  };

  // 7. Write compiled dataset
  console.log("\n💾 Writing compiled dataset...");
  writeFileSync(COMPILED_FILE, JSON.stringify(compiledDataset, null, 2) + "\n");
  console.log(`   Written to ${COMPILED_FILE}`);

  // 8. Generate thin index
  console.log("\n📇 Generating thin index...");
  const indexData = {
    version: compiledDataset.version,
    generatedAt: compiledDataset.generatedAt,
    locales: compiledDataset.uiLocales,
    items: compiledProfessions.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      synonyms: p.synonyms,
    })),
  };
  writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2) + "\n");
  console.log(`   Written to ${INDEX_FILE}`);

  // 9. Copy to public/data for client access
  console.log("\n📂 Copying to public/data...");
  ensureDir(PUBLIC_DATA_DIR);
  cpSync(INDEX_FILE, join(PUBLIC_DATA_DIR, "professions.index.json"));
  cpSync(
    join(CONTENT_DIR, "translations"),
    join(PUBLIC_DATA_DIR, "translations"),
    { recursive: true }
  );
  console.log(`   Index and translations copied to ${PUBLIC_DATA_DIR}`);

  // 10. Summary
  console.log("\n" + "═".repeat(60));
  console.log("✅ Compilation complete!");
  console.log(`   Professions: ${compiledProfessions.length}`);
  console.log(`   Slugs locked: ${Object.keys(slugsLock.slugsById).length}`);
  console.log(`   New slugs: ${slugUpdates.length}`);
  console.log("═".repeat(60) + "\n");
}

main();

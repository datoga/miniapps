#!/usr/bin/env node
/**
 * Script to merge professions from stdin into the raw file
 * Usage: cat new-data.json | node merge-professions.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.resolve(__dirname, "../content");
const RAW_FILE = path.join(CONTENT_DIR, "professions.raw.json");

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  console.log("🔄 Merging professions...\n");

  // Read existing data
  const existingData = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8"));
  const existingIds = new Set(existingData.professions.map((p) => p.id));

  console.log(`📦 Existing professions: ${existingData.professions.length}`);
  console.log(`   IDs: ${[...existingIds].join(", ")}\n`);

  // Read new professions from stdin
  const stdinData = await readStdin();
  const newData = JSON.parse(stdinData);
  const newProfessions = newData.professions || [];

  console.log(`📥 New professions to add: ${newProfessions.length}`);
  console.log(`   IDs: ${newProfessions.map((p) => p.id).join(", ")}\n`);

  // Check for duplicates
  const duplicates = newProfessions.filter((p) => existingIds.has(p.id));
  if (duplicates.length > 0) {
    console.error(
      `❌ ERROR: Found ${duplicates.length} duplicate IDs: ${duplicates.map((p) => p.id).join(", ")}`
    );
    console.error("   These professions will be SKIPPED.");
    // Filter out duplicates
    const uniqueNew = newProfessions.filter((p) => !existingIds.has(p.id));
    if (uniqueNew.length === 0) {
      console.log("   No new unique professions to add.");
      return;
    }
    existingData.professions = [...existingData.professions, ...uniqueNew];
  } else {
    // Merge professions
    existingData.professions = [...existingData.professions, ...newProfessions];
  }

  // Update generatedAt
  existingData.generatedAt = new Date().toISOString().split("T")[0];

  // Write back
  fs.writeFileSync(RAW_FILE, JSON.stringify(existingData, null, 2));

  console.log(`✅ Successfully merged!`);
  console.log(`📊 Total professions now: ${existingData.professions.length}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});

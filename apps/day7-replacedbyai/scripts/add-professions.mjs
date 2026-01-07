#!/usr/bin/env node
/**
 * Script to add new professions to the existing dataset
 * WITHOUT replacing existing ones
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CONTENT_DIR = path.resolve(__dirname, "../content");
const RAW_FILE = path.join(CONTENT_DIR, "professions.raw.json");
const NEW_PROFESSIONS_FILE = path.join(CONTENT_DIR, "new-professions.json");

async function main() {
  console.log("🔄 Adding new professions to existing dataset...\n");

  // Read existing data
  const existingData = JSON.parse(fs.readFileSync(RAW_FILE, "utf-8"));
  const existingIds = new Set(existingData.professions.map((p) => p.id));

  console.log(`📦 Existing professions: ${existingData.professions.length}`);
  console.log(`   IDs: ${[...existingIds].join(", ")}\n`);

  // Read new professions
  const newData = JSON.parse(fs.readFileSync(NEW_PROFESSIONS_FILE, "utf-8"));
  const newProfessions = newData.professions;

  console.log(`📥 New professions to add: ${newProfessions.length}`);
  console.log(`   IDs: ${newProfessions.map((p) => p.id).join(", ")}\n`);

  // Check for duplicates
  const duplicates = newProfessions.filter((p) => existingIds.has(p.id));
  if (duplicates.length > 0) {
    console.error(
      `❌ ERROR: Found ${duplicates.length} duplicate IDs: ${duplicates.map((p) => p.id).join(", ")}`
    );
    console.error("   These professions will NOT be added to prevent data loss.");
    process.exit(1);
  }

  // Merge professions
  existingData.professions = [...existingData.professions, ...newProfessions];

  // Update generatedAt
  existingData.generatedAt = new Date().toISOString().split("T")[0];

  // Write back
  fs.writeFileSync(RAW_FILE, JSON.stringify(existingData, null, 2));

  console.log(`✅ Successfully added ${newProfessions.length} new professions!`);
  console.log(`📊 Total professions now: ${existingData.professions.length}`);
  console.log(`\n🗑️  You can now delete ${NEW_PROFESSIONS_FILE}`);
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});


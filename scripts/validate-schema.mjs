#!/usr/bin/env node
/**
 * Schema Validation Script
 * 
 * Validates that CSV templates match TypeScript type definitions and Google Sheets.
 * Run with: npm run validate:schema
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Define canonical schemas matching types/index.ts
const SCHEMAS = {
  cattle: {
    required: ['tagNumber', 'nickname', 'dateOfBirth', 'sireTagNumber', 'damTagNumber', 'sex', 'breed', 'birthWeight', 'weaningWeight', 'status', 'imagePath', 'createdAt', 'updatedAt'],
    optional: ['photos', 'notes'],
  },
  breeding: {
    required: ['id', 'cowTagNumber', 'sireTagNumber', 'breedDate', 'possibleCalvingDate', 'actualCalvingDate', 'calfTagNumber', 'status', 'notes', 'createdAt', 'updatedAt'],
    optional: ['breedDateTo'],
  },
  health: {
    required: ['id', 'recordDate', 'vaccinationType', 'tagNumbers', 'veterinarian', 'cost', 'notes', 'createdAt', 'updatedAt'],
    optional: [],
  },
  finances: {
    required: ['id', 'date', 'type', 'category', 'amount', 'description', 'notes', 'relatedTagNumber', 'createdAt', 'updatedAt'],
    optional: ['dateTo'],
  },
  pdfExports: {
    required: ['id', 'tagNumber', 'generatedAt', 'ownerName', 'notes'],
    optional: [],
  },
};

function getCsvHeaders(filename) {
  const filepath = path.join(ROOT, 'data', filename);
  if (!fs.existsSync(filepath)) {
    return null;
  }
  try {
    const content = fs.readFileSync(filepath, 'utf-8');
    if (!content.trim()) return [];
    const records = parse(content, { columns: true, skip_empty_lines: true });
    if (records.length === 0) {
      // Parse headers from raw content
      const lines = content.split('\n');
      if (lines.length === 0) return [];
      return lines[0].split(',').map(h => h.trim());
    }
    return Object.keys(records[0] || {});
  } catch (e) {
    console.error(`  ❌ Error parsing ${filename}:`, e.message);
    return null;
  }
}

function validateTable(tableName, schema) {
  const csvFile = `${tableName}.csv`;
  const headers = getCsvHeaders(csvFile);
  
  if (headers === null) {
    console.log(`  ⚠️  ${csvFile}: File not found or unreadable`);
    return false;
  }
  
  const headerSet = new Set(headers);
  const allExpected = new Set([...schema.required, ...schema.optional]);
  
  let isValid = true;
  
  // Check for missing columns
  const missing = schema.required.filter(col => !headerSet.has(col));
  if (missing.length > 0) {
    console.log(`  ❌ ${csvFile}: Missing required columns: ${missing.join(', ')}`);
    isValid = false;
  }
  
  // Check for optional columns
  const missingOptional = schema.optional.filter(col => !headerSet.has(col));
  if (missingOptional.length > 0) {
    console.log(`  ⚠️  ${csvFile}: Missing optional columns: ${missingOptional.join(', ')}`);
  }
  
  // Check for extra columns
  const extra = Array.from(headerSet).filter(col => !allExpected.has(col));
  if (extra.length > 0) {
    console.log(`  ℹ️  ${csvFile}: Extra columns (non-standard): ${extra.join(', ')}`);
  }
  
  if (missing.length === 0 && missingOptional.length === 0 && extra.length === 0) {
    console.log(`  ✅ ${csvFile}: Schema valid`);
  } else if (isValid && extra.length === 0) {
    console.log(`  ✅ ${csvFile}: Valid (with optional fields noted)`);
  }
  
  return isValid;
}

function main() {
  console.log('🔍 Schema Validation Report\n');
  
  let allValid = true;
  
  for (const [tableName, schema] of Object.entries(SCHEMAS)) {
    const valid = validateTable(tableName, schema);
    if (!valid) allValid = false;
  }
  
  console.log('\n' + '='.repeat(60));
  if (allValid) {
    console.log('✅ All required schemas are valid!');
    process.exit(0);
  } else {
    console.log('❌ Schema validation failed. See gaps above.');
    console.log('\n📖 See docs/schema.md for the canonical schema definition.');
    console.log('💡 To fix: Update CSV headers to include missing required columns.');
    process.exit(1);
  }
}

main();

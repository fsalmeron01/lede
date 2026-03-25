#!/usr/bin/env node
"use strict";

const { Pool } = require("/app/node_modules/pg");
const fs = require("fs");
const path = require("path");

async function migrate() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  let retries = 10;
  while (retries > 0) {
    try { await pool.query("SELECT 1"); break; }
    catch {
      retries--;
      if (retries === 0) { console.error("[migrate] Postgres never ready."); process.exit(1); }
      console.log(`[migrate] Waiting for Postgres... (${retries} left)`);
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  const sql = fs.readFileSync(path.join(__dirname, "init.sql"), "utf8");
  try {
    await pool.query(sql);
    console.log("[migrate] Base schema applied.");
  } catch (err) {
    console.error("[migrate] Schema error:", err.message);
    process.exit(1);
  }

  // Safe column additions for existing deployments
  const alterations = [
    ["jobs",      "content_mode",        "TEXT NOT NULL DEFAULT 'camden-tribune'"],
    ["summaries", "mode",                "TEXT"],
    ["summaries", "mode_emoji",          "TEXT"],
    ["summaries", "newspack_excerpt",    "TEXT"],
    ["summaries", "categories_json",     "JSONB NOT NULL DEFAULT '[]'::jsonb"],
    ["summaries", "tags_json",           "JSONB NOT NULL DEFAULT '[]'::jsonb"],
    ["summaries", "yoast_json",          "JSONB NOT NULL DEFAULT '{}'::jsonb"],
    ["summaries", "headline_heat_score", "INTEGER"],
    ["summaries", "headline_heat_label", "TEXT"],
    ["summaries", "seo_strength_score",  "INTEGER"],
    ["summaries", "legal_risk_level",    "TEXT"],
    ["summaries", "legal_flags_json",    "JSONB NOT NULL DEFAULT '[]'::jsonb"],
    ["summaries", "readability_json",    "JSONB NOT NULL DEFAULT '{}'::jsonb"],
    ["summaries", "photo_guidance",      "TEXT"],
    ["summaries", "social_json",         "JSONB NOT NULL DEFAULT '{}'::jsonb"],
  ];

  for (const [table, col, type] of alterations) {
    try {
      await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col} ${type}`);
    } catch (err) {
      console.log(`[migrate] ${table}.${col}: ${err.message}`);
    }
  }

  console.log("[migrate] Schema is up to date.");
  await pool.end();
}

migrate();

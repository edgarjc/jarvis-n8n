#!/usr/bin/env node

/**
 * Jarvis Setup Script
 * Reads .env and populates workflow JSON files with your configuration
 *
 * Usage: node setup.js
 */

const fs = require('fs');
const path = require('path');

// Parse .env file
function parseEnv(filePath) {
  const env = {};
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
  } catch (err) {
    console.error('Error reading .env file:', err.message);
    process.exit(1);
  }
  return env;
}

// Validate required env vars
function validateEnv(env) {
  const required = [
    'TELEGRAM_CHAT_ID',
    'NOTION_MAIN_DB_ID',
    'NOTION_CONVERSATIONS_DB_ID',
    'WEATHER_LATITUDE',
    'WEATHER_LONGITUDE'
  ];

  const missing = [];

  required.forEach(key => {
    if (!env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('\n❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease add them to your .env file\n');
    process.exit(1);
  }

  // Clean DB IDs (remove ?v= suffix and dashes)
  env.NOTION_MAIN_DB_ID = env.NOTION_MAIN_DB_ID.split('?')[0].replace(/-/g, '');
  env.NOTION_CONVERSATIONS_DB_ID = env.NOTION_CONVERSATIONS_DB_ID.split('?')[0].replace(/-/g, '');

  // Validate DB ID format (32 hex chars)
  const dbIdRegex = /^[a-f0-9]{32}$/i;
  if (!dbIdRegex.test(env.NOTION_MAIN_DB_ID)) {
    console.error('\n❌ NOTION_MAIN_DB_ID looks invalid');
    console.error('   Expected: 32 character hex string');
    console.error(`   Got: ${env.NOTION_MAIN_DB_ID}\n`);
    process.exit(1);
  }
  if (!dbIdRegex.test(env.NOTION_CONVERSATIONS_DB_ID)) {
    console.error('\n❌ NOTION_CONVERSATIONS_DB_ID looks invalid');
    console.error('   Expected: 32 character hex string');
    console.error(`   Got: ${env.NOTION_CONVERSATIONS_DB_ID}\n`);
    process.exit(1);
  }
}

// Process a workflow file
function processWorkflow(filePath, config) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replacements
  const replacements = [
    // Telegram Chat ID
    ['YOUR_TELEGRAM_CHAT_ID', config.telegramChatId],

    // Main Jarvis Database ID (various formats)
    ['2d72ec63-f882-809a-85c5-d2f4927b3856', config.mainDbId],
    ['2d72ec63f882809a85c5d2f4927b3856', config.mainDbId],

    // Conversations Database ID
    ['JARVIS_CONVERSATIONS_DB_ID', config.conversationsDbId],

    // Weather coordinates (handle multiple possible values)
    ['"value": "40.7128"', `"value": "${config.latitude}"`],
    ['"value": "-74.0060"', `"value": "${config.longitude}"`],
    ['"value": "27.9506"', `"value": "${config.latitude}"`],
    ['"value": "-82.4572"', `"value": "${config.longitude}"`],
  ];

  replacements.forEach(([search, replace]) => {
    content = content.split(search).join(replace);
  });

  return content;
}

// Main
function main() {
  console.log('\n🤖 Jarvis Setup Script\n');
  console.log('Reading configuration from .env...\n');

  const envPath = path.join(__dirname, '.env');
  const env = parseEnv(envPath);

  validateEnv(env);

  // DB IDs are already cleaned in validateEnv
  const mainDbId = env.NOTION_MAIN_DB_ID;
  const conversationsDbId = env.NOTION_CONVERSATIONS_DB_ID;

  console.log('✅ Configuration:');
  console.log(`   Telegram Chat ID: ${env.TELEGRAM_CHAT_ID}`);
  console.log(`   Main DB: ${mainDbId.substring(0, 8)}...`);
  console.log(`   Conversations DB: ${conversationsDbId.substring(0, 8)}...`);
  console.log(`   Weather: ${env.WEATHER_LATITUDE}, ${env.WEATHER_LONGITUDE}`);
  console.log('');

  const config = {
    telegramChatId: env.TELEGRAM_CHAT_ID,
    mainDbId,
    conversationsDbId,
    latitude: env.WEATHER_LATITUDE,
    longitude: env.WEATHER_LONGITUDE
  };

  // Create configured output directory
  const outputDir = path.join(__dirname, 'configured');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Process each workflow
  const workflows = [
    'Jarvis.json',
    'Jarvis_DailyDigest.json',
    'Jarvis_SmartNotifications.json'
  ];

  console.log('📝 Generating configured workflows...\n');

  workflows.forEach(filename => {
    const inputPath = path.join(__dirname, filename);
    const outputPath = path.join(outputDir, filename);

    if (!fs.existsSync(inputPath)) {
      console.log(`   ⚠️  Skipping ${filename} (not found)`);
      return;
    }

    const processed = processWorkflow(inputPath, config);
    fs.writeFileSync(outputPath, processed);
    console.log(`   ✅ ${filename}`);
  });

  console.log('\n🎉 Done! Your configured workflows are in /configured\n');
  console.log('Next steps:');
  console.log('1. Open n8n');
  console.log('2. Import each JSON from the /configured folder');
  console.log('3. Set up credentials (Telegram, Notion, OpenAI)');
  console.log('4. Activate the workflows\n');
}

main();

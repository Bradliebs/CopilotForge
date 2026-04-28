'use strict';

const fs = require('fs');
const path = require('path');

/**
 * CopilotForge i18n — Phase 19/20
 *
 * Internationalization for CLI messages. Supports:
 *   en (English, default), es (Spanish), pt (Portuguese),
 *   ja (Japanese), de (German)
 *
 * Usage:
 *   COPILOTFORGE_LANG=es npx copilotforge init
 *   Or set `language` in .copilotforgerc
 */

const TRANSLATIONS = {
  en: {
    'init.setting-up': 'Setting up your project...',
    'init.created': 'Created {file}',
    'init.skipped': 'Skipped {file} (already exists)',
    'init.complete': '{count} file(s) created.',
    'init.overwrite': 'Overwrite existing files?',
    'doctor.healthy': 'Project is healthy',
    'doctor.issues': 'Issues found',
    'wizard.q1': 'What are you building?',
    'wizard.q2': 'What is your stack?',
    'wizard.q3': 'Do you want memory?',
    'wizard.q4': 'Do you want test automation?',
    'wizard.q5': 'What is your experience level?',
    'wizard.q6': 'Want to add any advanced features?',
    'wizard.confirm': 'Ready to scaffold?',
    'detect.path': 'Build path: {path} — {name}',
    'detect.confidence': 'Confidence: {level}',
    'review.scanning': 'Scanning {count} files...',
    'review.clean': 'No issues found',
    'status.plan': 'Plan: {done}/{total} tasks done',
    'status.memory': 'Memory: {count} entries',
    'error.not-found': 'File not found: {file}',
    'error.invalid-json': 'Invalid JSON: {error}',
    'common.yes': 'yes',
    'common.no': 'no',
    'common.cancel': 'Cancelled.',
  },
  es: {
    'init.setting-up': 'Configurando tu proyecto...',
    'init.created': 'Creado {file}',
    'init.skipped': 'Omitido {file} (ya existe)',
    'init.complete': '{count} archivo(s) creado(s).',
    'init.overwrite': '¿Sobrescribir archivos existentes?',
    'doctor.healthy': 'El proyecto está sano',
    'doctor.issues': 'Se encontraron problemas',
    'wizard.q1': '¿Qué estás construyendo?',
    'wizard.q2': '¿Cuál es tu stack?',
    'wizard.q3': '¿Quieres memoria?',
    'wizard.q4': '¿Quieres automatización de pruebas?',
    'wizard.q5': '¿Cuál es tu nivel de experiencia?',
    'wizard.q6': '¿Quieres agregar características avanzadas?',
    'wizard.confirm': '¿Listo para scaffolding?',
    'detect.path': 'Ruta: {path} — {name}',
    'detect.confidence': 'Confianza: {level}',
    'review.scanning': 'Escaneando {count} archivos...',
    'review.clean': 'No se encontraron problemas',
    'error.not-found': 'Archivo no encontrado: {file}',
    'common.yes': 'sí',
    'common.no': 'no',
    'common.cancel': 'Cancelado.',
  },
  de: {
    'init.setting-up': 'Projekt wird eingerichtet...',
    'init.created': 'Erstellt {file}',
    'init.skipped': 'Übersprungen {file} (existiert bereits)',
    'init.complete': '{count} Datei(en) erstellt.',
    'doctor.healthy': 'Projekt ist gesund',
    'doctor.issues': 'Probleme gefunden',
    'wizard.q1': 'Was baust du?',
    'wizard.q2': 'Was ist dein Stack?',
    'detect.path': 'Build-Pfad: {path} — {name}',
    'review.clean': 'Keine Probleme gefunden',
    'common.yes': 'ja',
    'common.no': 'nein',
    'common.cancel': 'Abgebrochen.',
  },
  pt: {
    'init.setting-up': 'Configurando seu projeto...',
    'init.created': 'Criado {file}',
    'init.complete': '{count} arquivo(s) criado(s).',
    'doctor.healthy': 'Projeto está saudável',
    'wizard.q1': 'O que você está construindo?',
    'detect.path': 'Caminho: {path} — {name}',
    'review.clean': 'Nenhum problema encontrado',
    'common.yes': 'sim',
    'common.no': 'não',
    'common.cancel': 'Cancelado.',
  },
  ja: {
    'init.setting-up': 'プロジェクトを設定しています...',
    'init.created': '{file} を作成しました',
    'init.complete': '{count} 個のファイルを作成しました',
    'doctor.healthy': 'プロジェクトは正常です',
    'wizard.q1': '何を作りますか？',
    'detect.path': 'ビルドパス: {path} — {name}',
    'review.clean': '問題は見つかりませんでした',
    'common.yes': 'はい',
    'common.no': 'いいえ',
    'common.cancel': 'キャンセルしました。',
  },
};

// ── Language detection ──────────────────────────────────────────────────

function detectLanguage() {
  // Priority: env var > config > system locale > default
  if (process.env.COPILOTFORGE_LANG) return process.env.COPILOTFORGE_LANG;

  try {
    const { loadConfig } = require('./config');
    const config = loadConfig();
    if (config.language) return config.language;
  } catch { /* config optional */ }

  // System locale fallback
  const locale = process.env.LANG || process.env.LC_ALL || process.env.LC_MESSAGES || '';
  const match = locale.match(/^([a-z]{2})/i);
  if (match && TRANSLATIONS[match[1].toLowerCase()]) return match[1].toLowerCase();

  return 'en';
}

// ── Translation function ────────────────────────────────────────────────

/**
 * Get a translated string.
 * @param {string} key - Translation key (e.g., 'init.setting-up')
 * @param {object} [params] - Interpolation parameters
 * @param {string} [lang] - Override language
 * @returns {string} Translated string
 */
function t(key, params = {}, lang) {
  const language = lang || detectLanguage();
  const translations = TRANSLATIONS[language] || TRANSLATIONS.en;
  let text = translations[key] || TRANSLATIONS.en[key] || key;

  // Interpolate parameters
  for (const [k, v] of Object.entries(params)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }

  return text;
}

/**
 * Get all available languages.
 */
function getAvailableLanguages() {
  return Object.keys(TRANSLATIONS).map((code) => ({
    code,
    name: { en: 'English', es: 'Spanish', de: 'German', pt: 'Portuguese', ja: 'Japanese' }[code] || code,
    keyCount: Object.keys(TRANSLATIONS[code]).length,
  }));
}

module.exports = {
  t,
  detectLanguage,
  getAvailableLanguages,
  TRANSLATIONS,
};

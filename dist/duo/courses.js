import { isObject, isString } from '../utils/functions';
/**
 * @typedef {object} LanguageName
 * @property {string} native The native name of the language.
 * @property {string} english The English name of the language.
 */

/**
 * @type {object.<string, LanguageName>}
 */

const LANGUAGE_NAMES = {
  ar: {
    native: 'العربية',
    english: 'Arabic'
  },
  ca: {
    native: 'Català',
    english: 'Catalan'
  },
  cs: {
    native: 'Čeština',
    english: 'Czech'
  },
  cy: {
    native: 'Cymraeg',
    english: 'Welsh'
  },
  da: {
    native: 'Dansk',
    english: 'Danish'
  },
  de: {
    native: 'Deutsch',
    english: 'German'
  },
  el: {
    native: 'Ελληνικά',
    english: 'Greek'
  },
  en: {
    native: 'English',
    english: 'English'
  },
  eo: {
    native: 'Esperanto',
    english: 'Esperanto'
  },
  es: {
    native: 'Español',
    english: 'Spanish'
  },
  fi: {
    native: 'Suomi',
    english: 'Finnish'
  },
  fr: {
    native: 'Français',
    english: 'French'
  },
  ga: {
    native: 'Gaeilge',
    english: 'Irish'
  },
  gd: {
    native: 'Gàidhlig',
    english: 'Gaelic'
  },
  gn: {
    native: 'Avañe\'ẽ',
    english: 'Guarani'
  },
  he: {
    native: 'עברית‏',
    english: 'Hebrew'
  },
  hi: {
    native: 'हिन्दी',
    english: 'Hindi'
  },
  hu: {
    native: 'Magyar',
    english: 'Hungarian'
  },
  hv: {
    native: 'High Valyrian',
    english: 'High Valyrian'
  },
  hw: {
    native: 'ʻŌlelo Hawaiʻi',
    english: 'Hawaiian'
  },
  id: {
    native: 'Bahasa Indonesia',
    english: 'Indonesian'
  },
  it: {
    native: 'Italiano',
    english: 'Italian'
  },
  ja: {
    native: '日本語',
    english: 'Japanese'
  },
  ko: {
    native: '한국어',
    english: 'Korean'
  },
  la: {
    native: 'Latin',
    english: 'Latin'
  },
  'nl-NL': {
    native: 'Nederlands',
    english: 'Dutch'
  },
  'no-BO': {
    native: 'Norsk (bokmål)',
    english: 'Norwegian (bokmal)'
  },
  nv: {
    native: 'Diné bizaad',
    english: 'Navajo'
  },
  pl: {
    native: 'Polski',
    english: 'Polish'
  },
  pt: {
    native: 'Português',
    english: 'Portuguese'
  },
  ro: {
    native: 'Română',
    english: 'Romanian'
  },
  ru: {
    native: 'Русский',
    english: 'Russian'
  },
  sv: {
    native: 'Svenska',
    english: 'Swedish'
  },
  sw: {
    native: 'Kiswahili',
    english: 'Swahili'
  },
  th: {
    native: 'ภาษาไทย',
    english: 'Thai'
  },
  tlh: {
    native: 'tlhIngan-Hol',
    english: 'Klingon'
  },
  tr: {
    native: 'Türkçe',
    english: 'Turkish'
  },
  uk: {
    native: 'Українська',
    english: 'Ukrainian'
  },
  vi: {
    native: 'Tiếng Việt',
    english: 'Vietnamese'
  },
  yi: {
    native: 'ייִדיש',
    english: 'Yiddish'
  },
  zh: {
    native: '中文',
    english: 'Chinese'
  },
  'zh-HK': {
    native: '中文（香港）',
    english: 'Chinese (Hong Kong)'
  }
};
/**
 * @param {string} tag A language tag.
 * @returns {LanguageName} The corresponding language names.
 */

export const getLanguageName = tag => {
  if (LANGUAGE_NAMES[tag]) {
    return LANGUAGE_NAMES[tag];
  }

  if (tag.indexOf('-') >= 0) {
    const mainTag = tag.split('-')[0];

    if (LANGUAGE_NAMES[mainTag]) {
      return LANGUAGE_NAMES[mainTag];
    }
  }

  return {
    native: tag,
    english: tag
  };
};
/**
 * @typedef {object} Course
 * @property {string} id The ID of the course.
 * @property {string} fromLanguage The language the user speaks.
 * @property {string} toLanguage The language the user learns.
 */

/**
 * @param {*} course Raw data about a course.
 * @returns {Course|null} The parsed course, if it is valid. Otherwise, null.
 */

export const parseCourse = course => isObject(course) && isString(course.id) && isString(course.fromLanguage) && isString(course.learningLanguage) && {
  id: course.id,
  fromLanguage: course.fromLanguage,
  toLanguage: course.learningLanguage
} || null;
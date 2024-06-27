import { isArray } from '../utils/functions';
import { CHALLENGE_TYPES, RESULT_CORRECT, RESULT_INCORRECT, RESULT_NONE } from './challenges';

/**
 * @type {string}
 */
export const CONTEXT_CHALLENGE = 'challenge';

/**
 * @type {string}
 */
export const CONTEXT_CHALLENGE_REVIEW = 'challenge_review';

/**
 * @type {string}
 */
export const CONTEXT_STORY = 'story';

/**
 * @type {string}
 */
export const CONTEXT_FORUM_DISCUSSION = 'forum_discussion';

/**
 * @type {string}
 */
export const CONTEXT_CHARACTERS = 'characters';

/**
 * @type {string}
 */
export const CONTEXT_DICTIONARY = 'dictionary';

/**
 * @type {string}
 */
export const CONTEXT_GUIDEBOOK = 'guidebook';

/**
 * @type {string}
 */
export const CONTEXT_UNKNOWN = 'unknown';

/**
 * @type {RegExp}
 */
const PAGE_URL_REGEXP_STORY = /duolingo\.com\/stories\/(?<story_key>[^/]+)/;

/**
 * @type {RegExp}
 */
const PAGE_URL_REGEXP_FORUM_COMMENT = /forum\.duolingo\.com\/comment\/(?<comment_id>[\d]+)/;

/**
 * @type {RegExp}
 */
const PAGE_URL_REGEXP_CHARACTER_LIST = /duolingo\.com\/characters\/?/;

/**
 * @type {RegExp}
 */
const PAGE_URL_REGEXP_CHARACTER_STUDY = /duolingo\.com\/alphabets\/?/;

/**
 * @type {RegExp}
 */
const PAGE_URL_REGEXP_GUIDEBOOK = /duolingo\.com\/guidebook\/(?<language>.+)\/(?<index>[\d]+)\/?/;

/**
 * @type {RegExp}
 */
const PAGE_URL_REGEXP_CHALLENGE = /duolingo\.com\/(practice|lesson)\/?/;

/**
 * @type {string}
 */
const SELECTOR_CHALLENGE_WRAPPER = '[data-test*="challenge"]';

/**
 * A CSS selector for the result wrapper of the current challenge screen.
 *
 * It is currently the previous sibling of the wrapper of the "Continue" button (in the challenge footer).
 * @type {string}
 */
const SELECTOR_CHALLENGE_RESULT_WRAPPER = '._2Fc1K ._1tuLI';

/**
 * The class name that is applied to the result wrapper of a challenge when the user has given a correct answer.
 * @type {string}
 */
const CLASS_NAME_CORRECT_CHALLENGE_RESULT_WRAPPER = '_3e9O1';

/**
 * @type {string}
 */
const SELECTOR_STORY_ELEMENT = '[data-test="stories-element"]';

/**
 * @returns {object} Data about the current context.
 */
export const getCurrentContext = () => {
  const url = document.location.href;

  // Forum discussions

  let urlMatches = url.match(PAGE_URL_REGEXP_FORUM_COMMENT);

  if (isArray(urlMatches)) {
    return {
      type: CONTEXT_FORUM_DISCUSSION,
      commentId: Number(urlMatches.comment_id) || null,
    };
  }

  // Stories

  urlMatches = url.match(PAGE_URL_REGEXP_STORY);

  if (isArray(urlMatches) || document.querySelector(SELECTOR_STORY_ELEMENT)) {
    return {
      type: CONTEXT_STORY,
      storyKey: urlMatches?.story_key,
    };
  }

  // Characters

  if (url.match(PAGE_URL_REGEXP_CHARACTER_LIST) || url.match(PAGE_URL_REGEXP_CHARACTER_STUDY)) {
    return {
      type: CONTEXT_CHARACTERS,
    };
  }

  // Guidebook

  urlMatches = url.match(PAGE_URL_REGEXP_GUIDEBOOK);

  if (isArray(urlMatches)) {
    return {
      type: CONTEXT_GUIDEBOOK,
      languageName: urlMatches.language,
      unitIndex: Number(urlMatches.index),
    };
  }

  // Challenges

  const challengeWrapper = document.querySelector(SELECTOR_CHALLENGE_WRAPPER);

  if (challengeWrapper) {
    let challengeType = null;

    for (const key of challengeWrapper.getAttribute('data-test')?.split(/\s+/) || []) {
      const possibleType = key.match(/challenge-(?<type>[a-z]+)/i)?.groups.type.trim();

      if (CHALLENGE_TYPES.indexOf(possibleType) >= 0) {
        challengeType = possibleType;
        break;
      }
    }

    let result = RESULT_NONE;
    const resultWrapper = document.querySelector(SELECTOR_CHALLENGE_RESULT_WRAPPER);

    if (resultWrapper) {
      result = resultWrapper.classList.contains(CLASS_NAME_CORRECT_CHALLENGE_RESULT_WRAPPER)
        ? RESULT_CORRECT
        : RESULT_INCORRECT;
    }

    return {
      type: CONTEXT_CHALLENGE,
      challengeType,
      result,
      isCompleted: (RESULT_NONE !== result),
    };
  }

  if (url.match(PAGE_URL_REGEXP_CHALLENGE)) {
    return {
      type: CONTEXT_CHALLENGE_REVIEW,
    };
  }

  return { type: CONTEXT_UNKNOWN };
}

/**
 * @returns {object}
 * The current Duo state.
 * Note that because it is stored on the main domain, the state is not available from e.g. the forum pages.
 */
export const getDuoState = () => JSON.parse(window.localStorage.getItem('duo.state') || '{}') || {};

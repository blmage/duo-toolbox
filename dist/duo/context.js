import { isArray } from '../utils/functions';
import { CHALLENGE_TYPES, RESULT_CORRECT, RESULT_INCORRECT, RESULT_NONE } from './challenges';
/**
 * @type {string}
 */

export const CONTEXT_CHALLENGE = 'challenge';
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

export const CONTEXT_DICTIONARY = 'dictionary';
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

const PAGE_URL_REGEXP_DICTIONARY = /duolingo\.com\/dictionary\/(?<language>.+)\/(?<lexeme>.+)\/(?<lexeme_id>[\w]+)\//;
/**
 * @type {string}
 */

const SELECTOR_CHALLENGE_WRAPPER = '[data-test*="challenge"]';
/**
 * A CSS selector for the result wrapper of the current challenge screen.
 *
 * It is currently the previous sibling of the wrapper of the "Continue" button (in the challenge footer).
 *
 * @type {string}
 */

const SELECTOR_CHALLENGE_RESULT_WRAPPER = '._2Fc1K ._1tuLI';
/**
 * The class name that is applied to the result wrapper of a challenge when the user has given a correct answer.
 *
 * @type {string}
 */

const CLASS_NAME_CORRECT_CHALLENGE_RESULT_WRAPPER = '_3e9O1';
/**
 * @type {string}
 */

const SELECTOR_STORY_ELEMENT = '[data-test="stories-element"]';
/**
 * @returns {Object} Data about the current context.
 */

export const getCurrentContext = () => {
  const url = document.location.href; // Forum discussions

  let urlMatches = url.match(PAGE_URL_REGEXP_FORUM_COMMENT);

  if (isArray(urlMatches)) {
    return {
      type: CONTEXT_FORUM_DISCUSSION,
      commentId: Number(urlMatches.comment_id) || null
    };
  } // Stories


  urlMatches = url.match(PAGE_URL_REGEXP_STORY);

  if (isArray(urlMatches) || document.querySelector(SELECTOR_STORY_ELEMENT)) {
    var _urlMatches;

    return {
      type: CONTEXT_STORY,
      storyKey: (_urlMatches = urlMatches) === null || _urlMatches === void 0 ? void 0 : _urlMatches.story_key
    };
  } // Dictionary entries


  urlMatches = url.match(PAGE_URL_REGEXP_DICTIONARY);

  if (isArray(urlMatches)) {
    return {
      type: CONTEXT_DICTIONARY,
      languageName: urlMatches.language,
      lexeme: urlMatches.lexeme,
      lexemeId: urlMatches.lexeme_id
    };
  } // Challenges


  const challengeWrapper = document.querySelector(SELECTOR_CHALLENGE_WRAPPER);

  if (challengeWrapper) {
    let challengeType = null;

    for (const key of ((_challengeWrapper$get = challengeWrapper.getAttribute('data-test')) === null || _challengeWrapper$get === void 0 ? void 0 : _challengeWrapper$get.split(/\s+/)) || []) {
      var _challengeWrapper$get, _key$match;

      const possibleType = (_key$match = key.match(/challenge-(?<type>[a-z]+)/i)) === null || _key$match === void 0 ? void 0 : _key$match.groups.type.trim();

      if (CHALLENGE_TYPES.indexOf(possibleType) >= 0) {
        challengeType = possibleType;
        break;
      }
    }

    let result = RESULT_NONE;
    const resultWrapper = document.querySelector(SELECTOR_CHALLENGE_RESULT_WRAPPER);

    if (resultWrapper) {
      result = resultWrapper.classList.contains(CLASS_NAME_CORRECT_CHALLENGE_RESULT_WRAPPER) ? RESULT_CORRECT : RESULT_INCORRECT;
    }

    return {
      type: CONTEXT_CHALLENGE,
      challengeType,
      result,
      isCompleted: RESULT_NONE !== result
    };
  }

  return {
    type: CONTEXT_UNKNOWN
  };
};
/**
 * @returns {object}
 * The current Duo state.
 * Note that because it is stored on the main domain, the state is not available from e.g. the forum pages.
 */

export const getDuoState = () => JSON.parse(window.localStorage.getItem('duo.state') || '{}') || {};
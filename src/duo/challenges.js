/**
 * @type {string}
 */
export const CHALLENGE_TYPE_CHARACTER_INTRO = 'characterIntro';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_CHARACTER_MATCH = 'characterMatch';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_CHARACTER_SELECT = 'characterSelect';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_COMPLETE_REVERSE_TRANSLATION = 'completeReverseTranslation';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_DEFINITION = 'definition';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_DIALOGUE = 'dialogue';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_FORM = 'form';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_FREE_RESPONSE = 'freeResponse';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_GAP_FILL = 'gapFill';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_JUDGE = 'judge';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_LISTEN = 'listen';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_LISTEN_COMPREHENSION = 'listenComprehension';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_LISTEN_TAP = 'listenTap';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_NAME = 'name';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_READ_COMPREHENSION = 'readComprehension';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_SELECT = 'select';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_SELECT_PRONUNCIATION = 'selectPronunciation';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_SELECT_TRANSCRIPTION = 'selectTranscription';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_SPEAK = 'speak';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_TAP_CLOZE = 'tapCloze';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_TAP_CLOZE_TABLE = 'tapClozeTable';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_TAP_COMPLETE = 'tapComplete';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_TAP_COMPLETE_TABLE = 'tapCompleteTable';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_TAP_DESCRIBE = 'tapDescribe';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_TRANSLATE = 'translate';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_TYPE_CLOZE = 'typeCloze';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_TYPE_CLOZE_TABLE = 'typeClozeTable';

/**
 * @type {string}
 */
export const CHALLENGE_TYPE_TYPE_COMPLETE_TABLE = 'typeCompleteTable';

/**
 * @type {string[]}
 */
export const CHALLENGE_TYPES = [
  CHALLENGE_TYPE_CHARACTER_INTRO,
  CHALLENGE_TYPE_CHARACTER_MATCH,
  CHALLENGE_TYPE_CHARACTER_SELECT,
  CHALLENGE_TYPE_COMPLETE_REVERSE_TRANSLATION,
  CHALLENGE_TYPE_DEFINITION,
  CHALLENGE_TYPE_DIALOGUE,
  CHALLENGE_TYPE_FORM,
  CHALLENGE_TYPE_FREE_RESPONSE,
  CHALLENGE_TYPE_GAP_FILL,
  CHALLENGE_TYPE_JUDGE,
  CHALLENGE_TYPE_LISTEN,
  CHALLENGE_TYPE_LISTEN_COMPREHENSION,
  CHALLENGE_TYPE_LISTEN_TAP,
  CHALLENGE_TYPE_NAME,
  CHALLENGE_TYPE_READ_COMPREHENSION,
  CHALLENGE_TYPE_SELECT,
  CHALLENGE_TYPE_SELECT_PRONUNCIATION,
  CHALLENGE_TYPE_SELECT_TRANSCRIPTION,
  CHALLENGE_TYPE_SPEAK,
  CHALLENGE_TYPE_TAP_CLOZE,
  CHALLENGE_TYPE_TAP_CLOZE_TABLE,
  CHALLENGE_TYPE_TAP_COMPLETE,
  CHALLENGE_TYPE_TAP_COMPLETE_TABLE,
  CHALLENGE_TYPE_TAP_DESCRIBE,
  CHALLENGE_TYPE_TRANSLATE,
  CHALLENGE_TYPE_TYPE_CLOZE,
  CHALLENGE_TYPE_TYPE_CLOZE_TABLE,
  CHALLENGE_TYPE_TYPE_COMPLETE_TABLE,
];

/**
 * @type {string[]}
 */
export const LISTENING_CHALLENGE_TYPES = [
  CHALLENGE_TYPE_LISTEN,
  CHALLENGE_TYPE_LISTEN_COMPREHENSION,
  CHALLENGE_TYPE_LISTEN_TAP,
];

/**
 * @type {string[]}
 */
export const ALL_LISTENING_CHALLENGE_TYPES = [
  ...LISTENING_CHALLENGE_TYPES,
  CHALLENGE_TYPE_SELECT_TRANSCRIPTION,
]

/**
 * @param {object} challenge A challenge.
 * @returns {string} The language used by the statement of the challenge.
 */
export const getChallengeSourceLanguage = challenge => (
  challenge.metadata?.source_language
  || challenge.sourceLanguage
  || challenge.metadata?.learning_language
);

/**
 * @param {object} challenge A challenge.
 * @returns {string} The language used by the solution of the challenge.
 */
export const getChallengeTargetLanguage = challenge => (
  challenge.metadata?.target_language
  || challenge.targetLanguage
  || getChallengeSourceLanguage(challenge)
);

/**
 * The result of challenges that have not been completed yet.
 *
 * @type {string}
 */
export const RESULT_NONE = 'none';

/**
 * The result of challenges to which a correct answer has been given.
 *
 * @type {string}
 */
export const RESULT_CORRECT = 'correct';

/**
 * The result of challenges to which an incorrect answer has been given.
 *
 * @type {string}
 */
export const RESULT_INCORRECT = 'incorrect';

import { _, _1, _2, _3, it, lift } from 'one-liner.macro';

import {
  bumpGlobalCounter,
  getSharedGlobalVariable,
  getToolboxIframe,
  getUniqueKey,
  overrideGlobalFunction,
  overrideInstanceMethod,
  setSharedGlobalVariable,
  updateSharedGlobalVariable,
} from '../utils/internal';

import {
  compareWith,
  escapeRegExp,
  getUrlPath,
  identity,
  isArray,
  isEmptyObject,
  isObject,
  isString,
} from '../utils/functions';

import { logError } from '../utils/logging';

import {
  getChallengeSourceLanguage,
  getChallengeTargetLanguage,
  getChallengeType,
  MORPHEME_CHALLENGE_TYPES,
} from './challenges';

import { parseCourse } from './courses';

import {
  SOUND_PLAYBACK_STRATEGY_HOWLER,
  SOUND_SPEED_NORMAL,
  SOUND_SPEED_SLOW,
  SOUND_TYPE_EFFECT,
  SOUND_TYPE_TTS_MORPHEME,
  SOUND_TYPE_TTS_SENTENCE,
  SOUND_TYPE_TTS_WORD,
  SOUND_TYPE_UNKNOWN,
} from './sounds';

/**
 * @type {string}
 */
const KEY_EVENT_LISTENERS = 'event_listeners';

/**
 * @returns {string} A unique ID usable for an event listener.
 */
const getUniqueEventListenerId = () => `__listener::${bumpGlobalCounter('last_event_listener_id')}__`;

/**
 * @type {Function}
 * @param {string} event An event type.
 * @returns {{[key: string]: Function[]}} The registered listeners for the given event type.
 */
const getEventListeners = getSharedGlobalVariable(KEY_EVENT_LISTENERS, {})?.[_] || {};

/**
 * @param {string} event An event type.
 * @param {{[key: string]: Function[]}} listeners The new set of listeners for the given event type.
 * @returns {void}
 */
const setEventListeners = (event, listeners) => {
  updateSharedGlobalVariable(
    KEY_EVENT_LISTENERS,
    Object.assign(_ || {}, { [event]: listeners }),
  );
};

/**
 * @type {Function}
 * @param {string} event An event type.
 * @returns {boolean} Whether any listener is registered for the given event type.
 */
const hasEventListeners = event => !isEmptyObject(getEventListeners(event));

/**
 * @type {Function}
 * @param {string} event An event type.
 * @param {string} listenerId A listener ID.
 * @returns {boolean} Whether a listener with the given ID was registered for the given event type.
 */
const hasEventListener = !!getEventListeners(_)[_];

/**
 * @param {string} event An event type.
 * @param {Function} callback The function to be called with the listeners registered for the given event type.
 * @returns {*|null} The result of the callback, if any listener exists for the given event type. Otherwise, null.
 */
const withEventListeners = (event, callback) => {
  const listeners = getEventListeners(event);
  return isEmptyObject(listeners) ? null : callback(Object.values(listeners));
};

/**
 * Registers a new listener for some event type.
 *
 * If a listener with the same ID already exists for the given event type, it will be replaced.
 * @param {string} event An event type.
 * @param {Function} callback The function to be called with the event payload when a matching event is dispatched.
 * @param {string=} listenerId The listener ID.
 * @returns {Function} A function usable to unregister the listener.
 */
const registerEventListener = (event, callback, listenerId = getUniqueEventListenerId()) => {
  const listeners = getEventListeners(event);
  listeners[listenerId] = callback;
  setEventListeners(event, listeners);
  return () => unregisterEventListener(event, listenerId);
};

/**
 * Registers a new listener for some event type, derived from another base event type.
 *
 * If a listener with the same ID already exists for the given derived event type, it will be replaced.
 * @param {string} derivedEvent The derived event type.
 * @param {string} baseEvent The base event type.
 * @param {Function} derivedCallback
 * The function to be called with the event payload when a matching derived event is dispatched.
 * @param {Function} mapPayload
 * The function usable to map the payloads of base events to the payloads of derived events.
 * This function must return an array of arguments, or anything else if the derived event should not be dispatched.
 * @param {Function=} registerBaseListener
 * The function usable to register the shared listener for base events, when necessary, given:
 * - the base event type,
 * - a callback,
 * - a listener ID.
 * @param {string=} derivedListenerId The ID of the listener for derived events.
 * @returns {Function} A function usable to unregister the listener for derived events.
 */
const registerDerivedEventListener =
  (
    derivedEvent,
    baseEvent,
    derivedCallback,
    mapPayload,
    registerBaseListener = registerEventListener,
    derivedListenerId = getUniqueEventListenerId()
  ) => {
    const baseListenerId = `__${baseEvent}::${derivedEvent}__`;

    if (!hasEventListener(baseEvent, baseListenerId)) {
      registerBaseListener(
        baseEvent,
        (...payload) => {
          const derivedPayload = mapPayload(...payload);
          isArray(derivedPayload) && dispatchEvent(derivedEvent, ...derivedPayload);
        },
        baseListenerId
      );
    }

    const unregisterDerived = registerEventListener(derivedEvent, derivedCallback, derivedListenerId);

    return () => {
      unregisterDerived();

      if (!hasEventListeners(derivedEvent)) {
        unregisterEventListener(baseEvent, baseListenerId);
      }
    };
  };

/**
 * @param {string} event An event type.
 * @param {string} listenerId A listener ID.
 * @returns {void}
 */
const unregisterEventListener = (event, listenerId) => {
  const listeners = getEventListeners(event);
  delete listeners[listenerId];
  setEventListeners(event, listeners);
};

/**
 * @type {Function}
 * @param {string} event The event type.
 * @param {...*} payload The event payload.
 * @returns {Array|null} The results of calling the registered listeners, if there is any. Otherwise, null.
 */
const dispatchEvent = (event, ...payload) => (
  withEventListeners(event, listeners => (
    listeners.flatMap(listener => {
      try {
        return [ listener(...payload) ];
      } catch (error) {
        return [];
      }
    })
  ))
);

/**
 * @type {string}
 */
const EVENT_TYPE_USER_DATA_LOADED = 'user_data_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_USER_COURSES_LOADED = 'user_courses_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_STORAGE_ITEM_CHANGED = 'storage_item_changed';

/**
 * @type {string}
 */
const EVENT_TYPE_DUO_STATE_CHANGED = 'duo_state_changed';

/**
 * @type {string}
 */
const EVENT_TYPE_PRACTICE_SESSION_LOADED = 'practice_session_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_PRACTICE_CHALLENGES_LOADED = 'practice_challenges_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_PRE_FETCHED_SESSION_LOADED = 'pre_fetched_session_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_STORY_LOADED = 'story_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_ALPHABETS_LOADED = 'alphabets_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_ALPHABET_HINTS_LOADED = 'alphabet_hints_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_FORUM_DISCUSSION_LOADED = 'forum_discussion_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_GUIDEBOOK_LOADED = 'guidebook_loaded';

/**
 * @type {string}
 */
const EVENT_TYPE_SOUND_INITIALIZED = 'sound_initialized';

/**
 * @type {string}
 */
const EVENT_TYPE_SOUND_PLAYBACK_REQUESTED = 'sound_playback_requested';

/**
 * @type {string}
 */
const EVENT_TYPE_SOUND_PLAYBACK_CONFIRMED = 'sound_playback_confirmed';

/**
 * @type {string}
 */
const EVENT_TYPE_SOUND_PLAYBACK_CANCELLED = 'sound_playback_cancelled';

/**
 * @type {string}
 */
const EVENT_TYPE_UI_LOADED = 'ui_loaded';

/**
 * @type {{[key: string]: RegExp}}
 */
const BASE_HTTP_REQUEST_EVENT_URL_REGEXPS = {
  [EVENT_TYPE_ALPHABETS_LOADED]: /\/[\d]{4}-[\d]{2}-[\d]{2}\/alphabets\/courses\/(?<toLanguage>[^/]+)\/(?<fromLanguage>[^/?]+)\/?/g,
  [EVENT_TYPE_FORUM_DISCUSSION_LOADED]: /\/comments\/([\d]+)/g,
  [EVENT_TYPE_GUIDEBOOK_LOADED]: /\/guidebook\/compiled\/(?<toLanguage>[^/]+)\/(?<fromLanguage>[^/]+)\/?/g,
  [EVENT_TYPE_PRACTICE_SESSION_LOADED]: /\/[\d]{4}-[\d]{2}-[\d]{2}\/sessions/g,
  [EVENT_TYPE_STORY_LOADED]: /\/api2\/stories/g,
  [EVENT_TYPE_USER_DATA_LOADED]: /\/[\d]{4}-[\d]{2}-[\d]{2}\/users\/[\d]+/g,
};

/**
 * @type {string}
 */
const KEY_HTTP_REQUEST_URL_EVENT_MAP = 'http_request_url_event_map';

/**
 * @typedef {object} HttpUrlEvent
 * @property {string} eventType An event type.
 * @property {RegExp} urlRegExp A regular expression for the URLs that should trigger the event type when called.
 * @property {object} requestData The base request data, common to all matching requests.
 */

/**
 * @returns {Map<*, HttpUrlEvent>} A map from unique keys to URL events.
 */
const getHttpRequestUrlEventMap = () => {
  let urlEventMap = getSharedGlobalVariable(KEY_HTTP_REQUEST_URL_EVENT_MAP);

  if (!(urlEventMap instanceof Map)) {
    urlEventMap = new Map();

    Object.entries(BASE_HTTP_REQUEST_EVENT_URL_REGEXPS)
      .forEach(([ eventType, urlRegExp ]) => {
        urlEventMap.set(
          urlRegExp,
          { eventType, urlRegExp, requestData: {} }
        );
      });

    setSharedGlobalVariable(KEY_HTTP_REQUEST_URL_EVENT_MAP, urlEventMap);
  }

  return urlEventMap;
};

/**
 * @param {string} event An event type.
 * @param {Array<string|RegExp>} urls URLs that should trigger the given event type when called.
 * @param {object} requestData The base request data, common to all matching requests.
 */
const registerAdditionalUrlEvents = (event, urls, requestData = {}) => {
  const urlEventMap = getHttpRequestUrlEventMap();

  for (const url of urls) {
    urlEventMap.set(url, {
      eventType: event,
      requestData,
      urlRegExp: (url instanceof RegExp) ? url : new RegExp(escapeRegExp(String(url)), 'g'),
    });
  }
};

/**
 * @param {string} url An URL.
 * @returns {{ eventType: string, requestData: object }|null} The corresponding event data, if any.
 */
const getUrlEventData = url => {
  let eventType;
  let requestData;
  const urlEventMap = getHttpRequestUrlEventMap();

  for (const urlEvent of urlEventMap.values()) {
    const urlMatches = Array.from(url.matchAll(urlEvent.urlRegExp))[0];

    if (urlMatches) {
      eventType = urlEvent.eventType;
      requestData = { ...urlEvent.requestData, ...(urlMatches.groups || {}) };
      break;
    }
  }

  return eventType ? { eventType, requestData } : null;
};

/**
 * @param {string} event An event type based on XHR requests to some specific URLs.
 * @param {Function} callback The function to be called with the response data, when a matching request is made.
 * @param {string=} listenerId The listener ID.
 * @returns {Function} A function usable to unregister the listener.
 */
const registerHttpRequestEventListener = (event, callback, listenerId = getUniqueEventListenerId()) => {
  overrideInstanceMethod('XMLHttpRequest', 'open', originalXhrOpen => (
    function (method, url, async, user, password) {
      const urlEvent = getUrlEventData(url);

      if (urlEvent) {
        withEventListeners(urlEvent.eventType, listeners => {
          this.addEventListener('load', () => {
            try {
              const responseData = isObject(this.response) ? this.response : JSON.parse(this.responseText);
              listeners.forEach(it(responseData, urlEvent.requestData));
            } catch (error) {
              logError(error, `Could not handle the XHR result (event: "${urlEvent.eventType}"): `);
            }
          });
        });
      }

      return originalXhrOpen.call(this, method, url, async, user, password);
    }
  ), 3);

  overrideGlobalFunction('fetch', originalFetch => function (resource, init) {
    const url = (resource instanceof Request) ? resource.url : String(resource);
    let loadCallback = null;
    const urlEvent = getUrlEventData(url);

    if (urlEvent) {
      loadCallback = withEventListeners(urlEvent.eventType, listeners => (
        responseData => {
          try {
            listeners.forEach(it(responseData, urlEvent.requestData));
          } catch (error) {
            logError(error, `Could not handle the fetch result (event: "${urlEvent.eventType}"): `);
          }
        }
      ));
    }

    return originalFetch.call(this, resource, init)
      .then(response => {
        if (!loadCallback) {
          return response;
        }

        const originalResponse = response.clone();

        return response.json()
          .then(payload => {
            loadCallback(payload);
            return originalResponse;
          })
          .catch(() => originalResponse)
      })
  }, 2);

  return registerEventListener(event, callback, listenerId);
};

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the response data when user data is loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded user data.
 */
export const onUserDataLoaded = registerHttpRequestEventListener(EVENT_TYPE_USER_DATA_LOADED, _);

/**
 * @param {Function} callback The function to be called with the session data, when a pre-fetched session is loaded.
 * @param {string=} listenerId The listener ID.
 * @returns {Function} A function usable to unregister the listener.
 */
const registerPreFetchedSessionLoadListener = (callback, listenerId = getUniqueEventListenerId()) => {
  const event = EVENT_TYPE_PRE_FETCHED_SESSION_LOADED;

  const patchIdbRequest = request => withEventListeners(event, listeners => {
    request.addEventListener('success', () => {
      try {
        listeners.forEach(it(request.result));
      } catch (error) {
        logError(error, `Could not handle the IDBRequest result (event: ${event}): `);
      }
    });
  });

  overrideInstanceMethod('IDBIndex', 'get', originalGet => function (key) {
    const request = originalGet.call(this, key);

    if (isString(key) && key && (this.objectStore.name === 'prefetchedSessions')) {
      patchIdbRequest(request);
    }

    return request;
  });

  overrideInstanceMethod('IDBObjectStore', 'get', originalGet => function (key) {
    const request = originalGet.call(this, key);

    if (this.name === 'prefetchedSessions') {
      patchIdbRequest(request);
    }

    return request;
  });

  return registerEventListener(event, callback, listenerId);
};

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the response data when a practice session is loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded practice sessions.
 */
export const onPracticeSessionLoaded = callback => {
  const unregisterFreshSessionListener = registerHttpRequestEventListener(
    EVENT_TYPE_PRACTICE_SESSION_LOADED,
    callback
  );

  const unregisterPreFetchedSessionListener = registerDerivedEventListener(
    EVENT_TYPE_PRACTICE_SESSION_LOADED,
    EVENT_TYPE_PRE_FETCHED_SESSION_LOADED,
    callback,
    identity,
    registerPreFetchedSessionLoadListener(_2, _3)
  );

  return () => {
    unregisterFreshSessionListener();
    unregisterPreFetchedSessionListener();
  };
};

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the session data when a pre-fetched session is loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded pre-fetched practice sessions.
 */
export const onPreFetchedSessionLoaded = registerPreFetchedSessionLoadListener(
  EVENT_TYPE_PRE_FETCHED_SESSION_LOADED,
  _
);

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the response data when a story is loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded stories.
 */
export const onStoryLoaded = registerHttpRequestEventListener(EVENT_TYPE_STORY_LOADED, _);

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the response and request data when alphabets are loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded alphabets.
 */
export const onAlphabetsLoaded = registerHttpRequestEventListener(EVENT_TYPE_ALPHABETS_LOADED, _, _);

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the response data when alphabet hints are loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded alphabet hints.
 */
export const onAlphabetHintsLoaded = registerHttpRequestEventListener(EVENT_TYPE_ALPHABET_HINTS_LOADED, _);

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the response data when a forum discussion is loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded forum discussions.
 */
export const onForumDiscussionLoaded = registerHttpRequestEventListener(EVENT_TYPE_FORUM_DISCUSSION_LOADED, _);

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the response data when a guidebook is loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded guidebooks.
 */
export const onGuidebookLoaded = registerHttpRequestEventListener(EVENT_TYPE_GUIDEBOOK_LOADED, _);

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the user courses when user data is loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded user courses.
 */
export const onUserCoursesLoaded = registerDerivedEventListener(
  EVENT_TYPE_USER_COURSES_LOADED,
  EVENT_TYPE_USER_DATA_LOADED,
  _,
  userData => {
    let payload;

    if (
      isObject(userData)
      && isArray(userData.courses)
      && isString(userData.fromLanguage)
      && isString(userData.learningLanguage)
    ) {
      const courses = userData.courses.map(parseCourse).filter(isObject);

      const currentCourse = courses.find(
        (it.fromLanguage === userData.fromLanguage)
        && (it.toLanguage === userData.learningLanguage)
      );

      payload = [ { courses, currentCourse } ];
    }

    return payload;
  },
  registerHttpRequestEventListener
);

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the challenges data when a practice session is loaded.
 * @returns {Function} A function usable to stop being notified of newly loaded challenges.
 */
export const onPracticeChallengesLoaded = callback => {
  const getSessionChallenges = sessionData => {
    let payload;

    if (isObject(sessionData)) {
      if (isObject(sessionData.session)) {
        sessionData = sessionData.session;
      }

      const challenges = [
        sessionData.challenges,
        sessionData.adaptiveChallenges,
        sessionData.easierAdaptiveChallenges,
        sessionData.mistakesReplacementChallenges,
        sessionData.adaptiveInterleavedChallenges?.challenges,
      ].filter(isArray).flat();

      const sessionMetaData = sessionData.metadata || {};

      payload = [ { challenges, sessionMetaData } ];
    }

    return payload;
  };

  const unregisterFreshChallengesListener = registerDerivedEventListener(
    EVENT_TYPE_PRACTICE_CHALLENGES_LOADED,
    EVENT_TYPE_PRACTICE_SESSION_LOADED,
    callback,
    getSessionChallenges,
    registerHttpRequestEventListener
  );

  const unregisterPreFetchedChallengesListener = registerDerivedEventListener(
    EVENT_TYPE_PRACTICE_CHALLENGES_LOADED,
    EVENT_TYPE_PRE_FETCHED_SESSION_LOADED,
    callback,
    getSessionChallenges,
    registerPreFetchedSessionLoadListener(_2, _3)
  );

  return () => {
    unregisterFreshChallengesListener();
    unregisterPreFetchedChallengesListener();
  };
};

/**
 * @typedef {object} SoundData
 * @property {string} url The URL of the sound (that may be of any shape).
 * @property {string} type The type of the sound.
 * @property {string} speed The speed of the sound.
 * @property {string|null} language The language of the sound, in case of a sentence / word.
 */

/**
 * @param {string} url The URL of the effect sound.
 * @returns {SoundData} Relevant data about the given sound.
 */
const getEffectSoundData = url => ({
  url,
  type: SOUND_TYPE_EFFECT,
  speed: SOUND_SPEED_NORMAL,
  language: null,
});

/**
 * @param {string} url The URL of the sentence sound.
 * @param {string} language The language of the sentence.
 * @returns {SoundData} Relevant data about the given sound.
 */
const getNormalSentenceSoundData = (url, language) => ({
  url,
  type: SOUND_TYPE_TTS_SENTENCE,
  speed: SOUND_SPEED_NORMAL,
  language,
});

/**
 * @param {string} url The URL of the sentence sound.
 * @param {string} language The language of the sentence.
 * @returns {SoundData} Relevant data about the given sound.
 */
const getSlowSentenceSoundData = (url, language) => ({
  url,
  type: SOUND_TYPE_TTS_SENTENCE,
  speed: SOUND_SPEED_SLOW,
  language,
});

/**
 * @param {string} url The URL of the word sound.
 * @param {string} language The language of the word.
 * @returns {SoundData} Relevant data about the given sound.
 */
const getNormalWordSoundData = (url, language) => ({
  url,
  type: SOUND_TYPE_TTS_WORD,
  speed: SOUND_SPEED_NORMAL,
  language,
});

/**
 * @param {string} url The URL of the morpheme sound.
 * @param {string} language The language of the morpheme.
 * @returns {SoundData} Relevant data about the given sound.
 */
const getNormalMorphemeSoundData = (url, language) => ({
  url,
  type: SOUND_TYPE_TTS_MORPHEME,
  speed: SOUND_SPEED_NORMAL,
  language,
});

/**
 * @type {{[key: string]: SoundData}}
 */
const DEFAULT_SOUNDS_DATA_MAP = Object.fromEntries(
  [
    '/sounds/7abe057dc8446ad325229edd6d8fd250.mp3',
    '/sounds/2aae0ea735c8e9ed884107d6f0a09e35.mp3',
    '/sounds/421d48c53ad6d52618dba715722278e0.mp3',
    '/sounds/37d8f0b39dcfe63872192c89653a93f6.mp3',
    '/sounds/0a27c1ee63dd220647e8410a0029aed2.mp3',
    '/sounds/a28ff0a501ef5f33ca78c0afc45ee53e.mp3',
    '/sounds/2e4669d8cf839272f0731f8afa488caf.mp3',
    '/sounds/f0b6ab4396d5891241ef4ca73b4de13a.mp3',
  ].map(path => [ path, getEffectSoundData(path) ])
);

/**
 * @type {RegExp}
 */
const URL_REGEXP_TTS_TOKEN = /\/duolingo-data\/tts\/(?<language>[a-z-_]+)\/token\//i;

/**
 * @type {string}
 */
const KEY_SOUNDS_DATA_MAP = 'sound_type_map';

/**
 * @type {string}
 */
const KEY_IS_HOWLER_USED = 'is_howler_used';

/**
 * @returns {{[key: string]: SoundData}} Relevant data about all the detected sounds, by path on the corresponding CDNs.
 */
const getSoundsDataMap = () => getSharedGlobalVariable(KEY_SOUNDS_DATA_MAP, DEFAULT_SOUNDS_DATA_MAP);

/**
 * @param {string} path The path of a sound on its CDN.
 * @returns {SoundData|null} Relevant data about the given sound, if it was loaded and detected.
 */
const getSoundData = path => {
  const soundData = getSoundsDataMap()[path];

  if (isObject(soundData)) {
    return soundData;
  }

  const tokenMatches = path.match(URL_REGEXP_TTS_TOKEN);

  if (tokenMatches) {
    return getNormalWordSoundData(path, tokenMatches.language);
  }

  return null;
}

/**
 * @type {string[]}
 */
const SOUND_TYPE_RELEVANCE = [
  SOUND_TYPE_UNKNOWN,
  SOUND_TYPE_TTS_SENTENCE,
  SOUND_TYPE_TTS_WORD,
  SOUND_TYPE_TTS_MORPHEME,
  SOUND_TYPE_EFFECT,
];

/**
 * @type {string[]}
 */
const SOUND_SPEED_RELEVANCE = [
  SOUND_SPEED_NORMAL,
  SOUND_SPEED_SLOW,
];

/**
 * @type {Function}
 * @param {SoundData} dataA Some sound data.
 * @param {SoundData} dataB Other sound data.
 * @returns {number}
 * A number:
 * - > 0 if the first sound data are more relevant than the second,
 * - < 0 if the second sound data are more relevant than the first,
 * - 0, if both sound data are equally relevant.
 */
const compareSoundDataRelevance = compareWith(
  [
    lift(SOUND_TYPE_RELEVANCE.indexOf(_.type) - SOUND_TYPE_RELEVANCE.indexOf(_.type)),
    lift(SOUND_SPEED_RELEVANCE.indexOf(_.speed) - SOUND_SPEED_RELEVANCE.indexOf(_.speed)),
  ],
  _,
  _
);

/**
 * @param {SoundData[]} newData New data about a set of sounds.
 * @returns {void}
 */
const registerSoundsData = newData => {
  const soundsData = getSoundsDataMap() || {};

  for (const soundData of newData) {
    const path = getUrlPath(soundData.url);

    if (
      !soundsData[path]
      || (compareSoundDataRelevance(soundData, soundsData[path]) > 0)
    ) {
      soundsData[path] = soundData;
    }
  }

  setSharedGlobalVariable(KEY_SOUNDS_DATA_MAP, soundsData);
};

/**
 * @type {number}
 */
const SOUND_DETECTION_LISTENERS_VERSION = 4;

/**
 * @type {string}
 */
const KEY_SOUND_DETECTION_LISTENERS_VERSION = 'sound_detection_listeners_version';

/**
 * @type {string}
 */
const KEY_SOUND_DETECTION_UNREGISTRATION_CALLBACKS = 'sound_detection_unregistration_callbacks';

/**
 * @param {object} sound The configuration of a speaker sound.
 * @param {string} type The type of the sound.
 * @param {string} language The language of the sound.
 * @returns {SoundData} Relevant data about the given sound.
 */
const getSpeakerSoundData = (sound, type, language) => ({
  url: sound.url,
  type,
  speed: sound.speed?.value || SOUND_SPEED_NORMAL,
  language,
});

/**
 * @param {Array} challenges A list of challenges.
 * @returns {void}
 */
const registerPracticeChallengesSoundsData = challenges => {
  const challengeSounds = [];

  for (const challenge of challenges) {
    const challengeType = getChallengeType(challenge);
    const sourceLanguage = getChallengeSourceLanguage(challenge);
    const targetLanguage = getChallengeTargetLanguage(challenge);

    if (isString(challenge.tts)) {
      // The challenge statement.
      const getTtsSoundData = (MORPHEME_CHALLENGE_TYPES.indexOf(challengeType) >= 0)
        ? getNormalMorphemeSoundData
        : getNormalSentenceSoundData;

      challengeSounds.push(getTtsSoundData(challenge.tts, sourceLanguage));
    }

    if (isString(challenge.slowTts)) {
      // The challenge statement, slowed down.
      challengeSounds.push(getSlowSentenceSoundData(challenge.slowTts, sourceLanguage));
    }

    if (isString(challenge.solutionTts)) {
      // The challenge solution.
      challengeSounds.push(getNormalSentenceSoundData(challenge.solutionTts, targetLanguage));
    }

    if (isArray(challenge.choices)) {
      // The possible choices for MCQ-like challenges, or the available words for the word banks.
      const getChoiceSoundData = (MORPHEME_CHALLENGE_TYPES.indexOf(challengeType) === -1)
        ? getNormalWordSoundData
        : getNormalMorphemeSoundData;

      challengeSounds.push(
        challenge.choices
          .map(it?.tts)
          .filter(isString)
          .map(getChoiceSoundData(_, targetLanguage))
      );
    }

    if (isArray(challenge.tokens)) {
      // The words that make up the statement for most types of challenges.
      challengeSounds.push(
        challenge.tokens
          .map(it?.tts)
          .filter(isString)
          .map(getNormalWordSoundData(_, sourceLanguage))
      );
    }

    if (isArray(challenge.displayTokens)) {
      // The words that make up the statement for (at least) definitions.
      challengeSounds.push(
        challenge.displayTokens
          .map(it?.hintToken?.tts)
          .filter(isString)
          .map(getNormalWordSoundData(_, sourceLanguage))
      );
    }

    if (isArray(challenge.questionTokens)) {
      // The words that make up the statement for (at least) listening comprehension challenges.
      challengeSounds.push(
        challenge.questionTokens
          .map(it?.tts)
          .filter(isString)
          .map(getNormalWordSoundData(_, targetLanguage))
      );
    }

    if (isArray(challenge.metadata?.speakers)) {
      // The sentences (and corresponding words) that make up a dialogue, voiced  by different speakers.
      for (const speaker of challenge.metadata.speakers) {
        if (isObject(speaker.tts?.tokens)) {
          challengeSounds.push(
            Object.values(speaker.tts.tokens)
              .filter(isString(_.url))
              .map(getSpeakerSoundData(_, SOUND_TYPE_TTS_WORD, targetLanguage))
          );
        }

        if (isArray(speaker.tts?.sentence)) {
          challengeSounds.push(
            speaker.tts.sentence
              .filter(isString(_.url))
              .map(getSpeakerSoundData(_, SOUND_TYPE_TTS_SENTENCE, targetLanguage))
          );
        }
      }
    }

    if (isArray(challenge.pairs)) {
      // The pairs of characters or words for matching challenges.
      const getPairSoundData = (MORPHEME_CHALLENGE_TYPES.indexOf(challengeType) === -1)
        ? getNormalWordSoundData
        : getNormalMorphemeSoundData;

      challengeSounds.push(
        challenge.pairs
          .map(it?.tts)
          .filter(isString)
          .map(getPairSoundData(_, targetLanguage))
      );
    }

    if (isArray(challenge.options)) {
      // The choices for listening fill-in-the-blank challenges, or "How do I say?" challenges.
      challengeSounds.push(
        challenge.options
          .map(it?.tts)
          .filter(isString)
          .map(getNormalWordSoundData(_, targetLanguage))
      );
    }

    if (isArray(challenge.dialogue)) {
      // The sentences (and corresponding words) that make up a dialogue, voiced  by different speakers.
      challengeSounds.push(
        challenge.dialogue
          .map(it?.tts)
          .filter(isString)
          .map(getNormalSentenceSoundData(_, targetLanguage))
      );

      challengeSounds.push(
        challenge.dialogue
          .map(it?.hintTokens)
          .filter(isArray)
          .flat()
          .map(it?.tts)
          .filter(isString)
          .map(getNormalWordSoundData(_, targetLanguage))
      );
    }
  }

  registerSoundsData(challengeSounds.flat());
};

/**
 * @param {object} story A story.
 * @returns {void}
 */
const registerStorySoundsData = story => {
  isArray(story?.elements)
  && registerSoundsData(
    story.elements
      .map(it?.line?.content || it?.learningLanguageTitleContent)
      .flatMap(lift([ _1?.audio, _1?.audioPrefix, _1?.audioSuffix ]))
      .map(it?.url)
      .filter(isString)
      .map(getNormalSentenceSoundData(_, story.learningLanguage))
  )
};

/**
 * @param {object} payload The response payload.
 * @param {object} languages Language data from the alphabets request.
 * @returns {void}
 */
const registerAlphabetsSoundsData = (payload, languages) => {
  if (isArray(payload?.alphabets) && isString(languages?.toLanguage)) {
    registerSoundsData(
      payload.alphabets
        .flatMap(it?.groups)
        .flatMap(it?.characters)
        .flat()
        .map(it?.ttsUrl)
        .filter(isString)
        .map(getNormalMorphemeSoundData(_, languages.toLanguage))
    );

    const hintsUrls = [];

    for (const alphabet of payload.alphabets) {
      if (isString(alphabet.explanationUrl)) {
        hintsUrls.push(alphabet.explanationUrl);
      }

      if (isArray(alphabet.explanationListing?.groups)) {
        hintsUrls.push(
          ...alphabet.explanationListing.groups
            .flatMap(it?.tips)
            .map(it?.url)
            .filter(isString)
        );
      }
    }

    if (hintsUrls.length > 0) {
      registerAdditionalUrlEvents(EVENT_TYPE_ALPHABET_HINTS_LOADED, hintsUrls, languages);
    }
  }
};

/**
 * @param {object} payload The response payload.
 * @param {object} languages Language data from the original alphabets request.
 * @returns {void}
 */
const registerAlphabetHintsSoundsData = (payload, languages) => {
  if (isArray(payload?.elements) && isString(languages?.toLanguage)) {
    const tokenSounds = payload.elements
      .map(it?.element)
      .flatMap(it?.tokenTTS?.tokenTTSCollection);

    tokenSounds.push(
      ...payload.elements
        .map(it?.element)
        .flatMap(it?.cells)
        .flat()
        .flatMap(it?.tokenTTS?.tokenTTSCollection)
    );

    registerSoundsData(
      tokenSounds
        .map(it?.ttsURL)
        .filter(isString)
        .map(getNormalMorphemeSoundData(_, languages.toLanguage))
    );
  }
};

/**
 * @param {object} discussion A forum discussion.
 * @returns {void}
 */
const registerForumDiscussionSoundsData = discussion => {
  isString(discussion?.tts_url)
  && registerSoundsData([ getNormalSentenceSoundData(discussion.tts_url, discussion.sentence_language) ])
};

/**
 * @param {object} element A guidebook element.
 * @param {string} language The language the user is learning.
 * @returns {SoundData[]} The sounds data for the given guidebook element.
 */
const getGuidebookElementSoundsData = (element, language) => {
  const elementSounds = [];
  const sentenceTts = element.ttsURL;

  if (isString(sentenceTts)) {
    elementSounds.push(
      getNormalSentenceSoundData(sentenceTts, language)
    );
  }

  return elementSounds.concat(
    [
      element.tokenTTS?.tokenTTSCollection || [],
      element.text?.tokenTTS?.tokenTTSCollection || [],
      element.subtext?.tokenTTS?.tokenTTSCollection || [],
    ].flat()
      .filter(isObject)
      .map(it?.ttsURL)
      .filter(lift(isString(_) && (_ !== sentenceTts)))
      .map(getNormalWordSoundData(_, language))
  );
};

/**
 * @param {object} guidebook A guidebook.
 * @param {object} languages Language data from the guidebook request.
 * @returns {void}
 */
export const registerGuidebookSoundsData = (guidebook, languages) => {
  if (isArray(guidebook?.elements) && isString(languages?.toLanguage)) {
    registerSoundsData(
      guidebook.elements
        .flatMap(({ element }) => (
          isObject(element)
          && [ element ]
            .concat(element.phrases || [])
            .concat(element.examples || [])
        ))
        .filter(isObject)
        .flatMap(getGuidebookElementSoundsData(_, languages.toLanguage))
    );
  }
};

/**
 * Registers the event listeners required for detecting the sounds used for TTS sentences and words, if necessary.
 * @returns {void}
 */
const registerSoundDetectionListeners = () => {
  const listenersVersion = Number(getSharedGlobalVariable(KEY_SOUND_DETECTION_LISTENERS_VERSION));
  const isDetectionActive = !!getSharedGlobalVariable(KEY_SOUND_DETECTION_UNREGISTRATION_CALLBACKS);
  const isDetectionUpToDate = SOUND_DETECTION_LISTENERS_VERSION <= (listenersVersion || 0);

  if (!isDetectionActive || !isDetectionUpToDate) {
    if (!isDetectionUpToDate) {
      unregisterUnusedSoundDetectionListeners();
    }

    setSharedGlobalVariable(
      KEY_SOUND_DETECTION_LISTENERS_VERSION,
      SOUND_DETECTION_LISTENERS_VERSION
    );

    setSharedGlobalVariable(
      KEY_SOUND_DETECTION_UNREGISTRATION_CALLBACKS,
      [
        onStoryLoaded(registerStorySoundsData(_)),
        onAlphabetsLoaded(registerAlphabetsSoundsData(_, _)),
        onAlphabetHintsLoaded(registerAlphabetHintsSoundsData(_, _)),
        onForumDiscussionLoaded(registerForumDiscussionSoundsData(_)),
        onGuidebookLoaded(registerGuidebookSoundsData(_, _)),
        onPracticeChallengesLoaded(registerPracticeChallengesSoundsData(_.challenges)),
      ]
    );
  }
};

/**
 * Unregisters the event listeners dedicated to detecting the sounds used for TTS sentences and words,
 * if all the listeners for sound playback events have also been unregistered.
 * @returns {void}
 */
const unregisterUnusedSoundDetectionListeners = () => {
  const unregistrationCallbacks = getSharedGlobalVariable(KEY_SOUND_DETECTION_UNREGISTRATION_CALLBACKS);

  if (
    isArray(unregistrationCallbacks)
    && !hasEventListeners(EVENT_TYPE_SOUND_INITIALIZED)
    && !hasEventListeners(EVENT_TYPE_SOUND_PLAYBACK_REQUESTED)
    && !hasEventListeners(EVENT_TYPE_SOUND_PLAYBACK_CANCELLED)
    && !hasEventListeners(EVENT_TYPE_SOUND_PLAYBACK_CONFIRMED)
  ) {
    unregistrationCallbacks.forEach(it());
    setSharedGlobalVariable(KEY_SOUND_DETECTION_LISTENERS_VERSION, null);
    setSharedGlobalVariable(KEY_SOUND_DETECTION_UNREGISTRATION_CALLBACKS, null);
  }
};

/**
 * @param {*} sound A sound object, whose type depends on the playback strategy.
 * @param {string} url The sound URL.
 * @param {string} playbackStrategy The strategy used for playing the sound.
 * @returns {object} The payload usable for events related to the given sound.
 */
const getSoundEventPayload = (sound, url, playbackStrategy) => {
  const soundData = getSoundData(getUrlPath(url));

  return {
    url,
    type: soundData?.type || SOUND_TYPE_UNKNOWN,
    speed: soundData?.speed || SOUND_SPEED_NORMAL,
    language: soundData?.language,
    playbackStrategy,
    sound,
  };
};

/**
 * @param {*} sound The sound to be played, whose type depends on the playback strategy.
 * @param {string} url The sound URL.
 * @param {string} playbackStrategy The strategy used for playing the sound.
 * @param {Function} play A callback usable to trigger the sound playback.
 * @returns {*|null} The result of calling the playback callback, or null if it was cancelled.
 */
const processSoundPlayback = (sound, url, playbackStrategy, play) => {
  const payload = getSoundEventPayload(sound, url, playbackStrategy);

  let isCancelled = false;

  try {
    isCancelled = dispatchEvent(EVENT_TYPE_SOUND_PLAYBACK_REQUESTED, payload)?.some(false === it);

    if (!isCancelled) {
      dispatchEvent(EVENT_TYPE_SOUND_PLAYBACK_CONFIRMED, payload);
    } else {
      dispatchEvent(EVENT_TYPE_SOUND_PLAYBACK_CANCELLED, payload);
    }
  } catch (error) {
    logError(error, `Could not handle playback for sound "${url}" (using "${playbackStrategy}"): `);
  }

  return isCancelled ? null : play();
};

/**
 * @param {Function} callback The function to be called when a sound is initialized
 * @returns {Function} A function usable to stop being notified of newly initialized sounds.
 */
export const onSoundInitialized = callback => {
  overrideInstanceMethod('Howl', 'init', originalHowlInit => function (config) {
    setSharedGlobalVariable(KEY_IS_HOWLER_USED, true);

    const result = originalHowlInit.call(this, config);
    const soundUrl = String(this._src || this._parent?._src || '').trim();

    if ('' !== soundUrl) {
      dispatchEvent(
        EVENT_TYPE_SOUND_INITIALIZED,
        getSoundEventPayload(this, soundUrl, SOUND_PLAYBACK_STRATEGY_HOWLER)
      );
    }

    return result;
  });

  registerSoundDetectionListeners();

  const unregisterDerived = registerEventListener(EVENT_TYPE_SOUND_INITIALIZED, callback);

  return () => {
    unregisterDerived();
    unregisterUnusedSoundDetectionListeners();
  };
};

/**
 * @param {string} event A type of sound playback event.
 * @param {Function} callback The function to be called with the event payload when a matching event is dispatched.
 * @returns {Function} A function usable to unregister the listener.
 */
const registerSoundPlaybackEventListener = (event, callback) => {
  overrideInstanceMethod('Howl', 'play', originalHowlPlay => function (id) {
    setSharedGlobalVariable(KEY_IS_HOWLER_USED, true);

    const soundUrl = String(this._src || this._parent?._src || '').trim();

    if ('' !== soundUrl) {
      return processSoundPlayback(
        this,
        soundUrl,
        SOUND_PLAYBACK_STRATEGY_HOWLER,
        () => originalHowlPlay.call(this, id)
      );
    }

    return originalHowlPlay.call(this, id);
  });

  registerSoundDetectionListeners();

  const unregisterDerived = registerEventListener(event, callback);

  return () => {
    unregisterDerived();
    unregisterUnusedSoundDetectionListeners();
  };
};

/**
 * @type {Function}
 * @param {Function} callback
 * The function to be called with the corresponding sound data when a playback is requested.
 * If this function returns false, the sound playback will be cancelled.
 * @returns {Function} A function usable to stop being notified of sound playback requests.
 */
export const onSoundPlaybackRequested = registerSoundPlaybackEventListener(EVENT_TYPE_SOUND_PLAYBACK_REQUESTED, _);

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the corresponding sound data when a playback is cancelled.
 * @returns {Function} A function usable to stop being notified of sound playback cancellations.
 */
export const onSoundPlaybackCancelled = registerSoundPlaybackEventListener(EVENT_TYPE_SOUND_PLAYBACK_CANCELLED, _);

/**
 * @type {Function}
 * @param {Function} callback The function to be called with the corresponding sound data when a playback is confirmed.
 * @returns {Function} A function usable to stop being notified of sound playback confirmations.
 */
export const onSoundPlaybackConfirmed = registerSoundPlaybackEventListener(EVENT_TYPE_SOUND_PLAYBACK_CONFIRMED, _);

/**
 * @type {string}
 */
const KEY_IS_UI_LOADED = 'is_ui_loaded';

/**
 * @type {string}
 */
const KEY_IS_UI_LOADING_DETECTED = 'is_ui_loading_detected';

/**
 * @param {Function} callback The function to be called when the UI is fully loaded.
 * @returns {void}
 */
export const onUiLoaded = callback => {
  if (getSharedGlobalVariable(KEY_IS_UI_LOADED)) {
    setTimeout(callback);
    return;
  }

  if (!getSharedGlobalVariable(KEY_IS_UI_LOADING_DETECTED)) {
    let cssLoadedPromise;

    if (isArray(window.duo?.stylesheets)) {
      cssLoadedPromise = new Promise(resolve => {
        // Regularly check if any of the stylesheets has been loaded
        // (the "stylesheets" array contain styles for both LTR and RTL directions).
        const checkStylesheets = () => {
          const isCssLoaded = Array.from(document.styleSheets)
            .some(sheet => window.duo.stylesheets.some(href => String(sheet.href || '').indexOf(href) >= 0));

          if (isCssLoaded) {
            clearInterval(checkInterval);
            resolve();
          }
        };

        const checkInterval = setInterval(checkStylesheets, 1000);

        checkStylesheets();
      });
    } else {
      cssLoadedPromise = Promise.resolve();
    }

    const callback = () => cssLoadedPromise.then(() => {
      setSharedGlobalVariable(KEY_IS_UI_LOADED, true);
      dispatchEvent(EVENT_TYPE_UI_LOADED);
    });

    if ((document.readyState === 'complete') || (document.readyState === 'interactive')) {
      setTimeout(callback, 1);
    } else {
      document.addEventListener('DOMContentLoaded', callback);
    }
  }

  registerEventListener(EVENT_TYPE_UI_LOADED, callback);
};

/**
 * @type {string}
 */
const KEY_HAS_STORAGE_EVENT_LISTENER = getUniqueKey('has_storage_event_listener');

/**
 * @param {Function} callback The function to be called with the relevant data when a storage item is changed.
 * @param {string=} listenerId A listener ID.
 * @returns {Function} A function usable to unregister the listener.
 */
const registerStorageEventListener = (callback, listenerId = getUniqueEventListenerId()) => {
  const iframe = getToolboxIframe();

  if (!iframe[KEY_HAS_STORAGE_EVENT_LISTENER]) {
    iframe[KEY_HAS_STORAGE_EVENT_LISTENER] = true;

    iframe.contentWindow.addEventListener('storage', event => (
      dispatchEvent(EVENT_TYPE_DUO_STATE_CHANGED, {
        key: event.key,
        oldValue: event.oldValue,
        newValue: event.newValue,
      })
    ));
  }

  return registerEventListener(EVENT_TYPE_STORAGE_ITEM_CHANGED, callback, listenerId);
};

/**
 * @param {Function} callback
 * The function to be called with the old and new Duo state when it is changed.
 * Note that because it is stored on the main domain, the Duo state is not available from e.g. the forum pages.
 * @returns {Function} A function usable to stop being notified of Duo state changes.
 */
export const onDuoStateChanged = registerDerivedEventListener(
  EVENT_TYPE_DUO_STATE_CHANGED,
  EVENT_TYPE_STORAGE_ITEM_CHANGED,
  _,
  ({ key, oldValue: oldState = null, newValue: newState = null }) => (key === 'duo.state') && ({ oldState, newState }),
  registerStorageEventListener(_2, _3)
);

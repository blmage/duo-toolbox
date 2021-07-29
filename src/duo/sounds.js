import { _, _1, _2, _3, it, lift } from 'one-liner.macro';
import { getUniqueKey } from '../utils/internal';

/**
 * @type {boolean}
 */
export const IS_AUDIO_PLAYBACK_SUPPORTED = false;

/**
 * @type {string}
 */
export const SOUND_TYPE_EFFECT = 'effect';

/**
 * @type {string}
 */
export const SOUND_TYPE_TTS_SENTENCE = 'tts_sentence';

/**
 * @type {string}
 */
export const SOUND_TYPE_TTS_WORD = 'tts_word';

/**
 * @type {string}
 */
export const SOUND_TYPE_UNKNOWN = 'unknown';

/**
 * @type {string[]}
 */
export const SOUND_TYPES = [
  SOUND_TYPE_EFFECT,
  SOUND_TYPE_TTS_SENTENCE,
  SOUND_TYPE_TTS_WORD,
  SOUND_TYPE_UNKNOWN,
];

/**
 * @type {string}
 */
export const SOUND_SPEED_NORMAL = 'normal';

/**
 * @type {string}
 */
export const SOUND_SPEED_SLOW = 'slow';

/**
 * @type {string[]}
 */
export const SOUND_SPEEDS = [
  SOUND_SPEED_NORMAL,
  SOUND_SPEED_SLOW,
];

/**
 * @type {string}
 */
export const SOUND_PLAYBACK_STRATEGY_AUDIO = 'audio';

/**
 * @type {string}
 */
export const SOUND_PLAYBACK_STRATEGY_HOWLER = 'howler';

/**
 * @type {string[]}
 */
export const SOUND_PLAYBACK_STRATEGIES = [
  SOUND_PLAYBACK_STRATEGY_AUDIO,
  SOUND_PLAYBACK_STRATEGY_HOWLER,
];

/**
 * @type {string}
 */
export const SOUND_SETTING_RATE = 'rate';

/**
 * @type {string}
 */
export const SOUND_SETTING_VOLUME = 'volume'

/**
 * @type {Object}
 */
const SOUND_SETTINGS = {
  [SOUND_SETTING_RATE]: {
    functions: {
      [SOUND_PLAYBACK_STRATEGY_AUDIO]: {
        getter: lift(_.playbackRate),
        setter: lift(_.playbackRate = _),
        addListener: lift(it.addEventListener('ratechange', _)),
      },
      [SOUND_PLAYBACK_STRATEGY_HOWLER]: {
        getter: lift(_.rate()),
        setter: lift(it.rate(_)),
        addListener: lift(it.on('rate', _)),
      },
    },
    minValue: 0.5,
    maxValue: 4.0,
    defaultValue: 1.0,
    valueKey: getUniqueKey('rate_value'),
    priorityKey: getUniqueKey('rate_priority'),
    hasListenerKey: getUniqueKey('has_rate_listener'),
  },
  [SOUND_SETTING_VOLUME]: {
    functions: {
      [SOUND_PLAYBACK_STRATEGY_AUDIO]: {
        getter: lift(_.volume),
        setter: lift(_.volume = _),
        addListener: lift(it.addEventListener('volumechange', _)),
      },
      [SOUND_PLAYBACK_STRATEGY_HOWLER]: {
        getter: lift(_.volume()),
        setter: lift(it.volume(_)),
        addListener: lift(it.on('volume', _)),
      },
    },
    minValue: 0.0,
    maxValue: 1.0,
    defaultValue: 1.0,
    valueKey: getUniqueKey('volume_value'),
    priorityKey: getUniqueKey('volume_priority'),
    hasListenerKey: getUniqueKey('has_volume_listener'),
  },
};

/**
 * @param {string} code The code of a sound setting.
 * @returns {Object} The configuration of the sound setting.
 */
const getSoundSetting = code => {
  const setting = SOUND_SETTINGS[code];

  if (!setting) {
    throw new Error(`Unknown sound setting: "${code}".`);
  }

  return setting;
};

/**
 * @param {string} code The code of a sound setting.
 * @param {string} playbackStrategy A playback strategy.
 * @returns {Object} The set of functions that can be used to deal with a given setting for a given type of sounds.
 */
const getSoundSettingFunctions = (code, playbackStrategy) => {
  if (SOUND_PLAYBACK_STRATEGIES.indexOf(playbackStrategy) === -1) {
    throw new Error(`Unknown sound playback strategy: "${playbackStrategy}".`);
  }

  return getSoundSetting(code).functions[playbackStrategy];
};

/**
 * @type {Function}
 * @param {string} code The code of a sound setting.
 * @returns {number} The minimum allowed value for the given setting.
 */
export const getSoundSettingMinValue = getSoundSetting(_).minValue;

/**
 * @type {Function}
 * @param {string} code The code of a sound setting.
 * @returns {number} The maximum allowed value for the given setting.
 */
export const getSoundSettingMaxValue = getSoundSetting(_).maxValue;

/**
 * @type {Function}
 * @param {string} code The code of a sound setting.
 * @returns {number} The default value for the given setting.
 */
export const getSoundSettingDefaultValue = getSoundSetting(_).defaultValue;

/**
 * @param {string} code The code of a sound setting.
 * @param {number} value A value for the given setting.
 * @returns {number} The given value, clamped if necessary.
 */
export const clampSoundSettingValue = (code, value) => {
  const setting = getSoundSetting(code);

  return Math.max(setting.minValue, Math.min(value, setting.maxValue));
};

/**
 * @type {Function}
 * @param {string} code The code of a sound setting.
 * @param {*} sound A sound object, whose type depends on the playback strategy.
 * @param {string} playbackStrategy The strategy used for playing the sound.
 * @returns {*} The current value of the setting for the given sound.
 */
export const getSoundSettingValue = getSoundSettingFunctions(_1, _3).getter(_2);

/**
 * Applies a new setting value to a sound.
 *
 * The new value can only be overridden by another call to setSoundSettingValue, with a high enough priority.
 *
 * @param {string} code The code of a sound setting.
 * @param {number} value The new setting value.
 * @param {*} sound A sound object, whose type depends on the playback strategy.
 * @param {string} playbackStrategy The strategy used for playing the sound.
 * @param {?number} priority The priority of the new setting value.
 * @returns {void}
 */
export const setSoundSettingValue = (code, value, sound, playbackStrategy, priority = 1) => {
  const setting = getSoundSetting(code);

  if (priority >= (Number(sound[setting.priorityKey]) || 0)) {
    const functions = getSoundSettingFunctions(code, playbackStrategy);
    const clampedValue = Math.max(setting.minValue, Math.min(value, setting.maxValue));

    sound[setting.valueKey] = clampedValue;
    sound[setting.priorityKey] = priority;
    functions.setter(sound, clampedValue);

    if (!sound[setting.hasListenerKey]) {
      sound[setting.hasListenerKey] = true;

      functions.addListener(sound, () => {
        const newValue = functions.getter(sound);

        if (newValue !== sound[setting.valueKey]) {
          setSoundSettingValue(
            code,
            sound[setting.valueKey],
            sound,
            playbackStrategy,
            sound[setting.priorityKey]
          );
        }
      });
    }
  }
};

/**
 * @param {*} howl A "Howl" object from the "howler.js" library.
 * @returns {number} The current position of the given "Howl" object.
 */
const getHowlSoundPosition = howl => {
  if (howl.state() !== 'loaded') {
    return 0.0;
  }

  const wasLocked = !!howl._playLock;

  if (wasLocked) {
    // The "_playLock" flag is used by "howler.js" to prevent seeking a new position at the wrong moment.
    // The fact that it also serves as a short-circuit when we just want to read the current position seems wrong:
    // https://github.com/goldfire/howler.js/blob/9117525f0883ddb995f99ee843bba7f6d3442590/src/howler.core.js#L1607.
    // See also this issue: https://github.com/goldfire/howler.js/issues/1189.
    // This was fixed in v2.2.1, but better be safe than sorry.
    howl._playLock = false;
  }

  // seek() always returns the position of the first sound in the pool:
  // https://github.com/goldfire/howler.js/blob/7c50da154af52bd4971ae75acbf6c078d256cd12/src/howler.core.js#L1584.
  // This fails to take into account the fact that the "Howl" object may contain multiple sounds:
  // when a play() is requested and all the existing sounds are "busy"
  // (either locked, waiting for their <audio> node to be ready, or simply already playing),
  // "howler.js" creates a clone of the original sound, that uses a new <audio> node for playing the sound.

  // Find the ID of any sound that isn't paused. If there's none, the position of the first sound will do.
  let soundId;
  const soundIds = howl._getSoundIds();

  for (let i = 0; i < soundIds.length; i++) {
    const sound = howl._soundById(soundIds[i]);

    if (!sound._paused) {
      soundId = sound._id;
      break;
    }
  }

  const position = Number(howl.seek(soundId));

  if (wasLocked) {
    howl._playLock = true;
  }

  return isNaN(position) ? 0.0 : position;
};

/**
 * @param {*} sound A sound object, whose type depends on the playback strategy.
 * @param {string} playbackStrategy The strategy used for playing the sound.
 * @returns {number} The current position of the sound.
 */
export const getSoundPosition = (sound, playbackStrategy) => (
  (SOUND_PLAYBACK_STRATEGY_AUDIO === playbackStrategy)
    ? sound.currentTime
    : getHowlSoundPosition(sound)
);

/**
 * @param {*} sound A sound object, whose type depends on the playback strategy.
 * @param {string} playbackStrategy The strategy used for playing the sound.
 * @returns {number} The duration of the sound.
 */
export const getSoundDuration = (sound, playbackStrategy) => (
  (SOUND_PLAYBACK_STRATEGY_AUDIO === playbackStrategy)
    ? sound.duration
    : sound.duration()
);

export {
  PRIORITY_LOWEST,
  PRIORITY_LOW,
  PRIORITY_AVERAGE,
  PRIORITY_HIGH,
  PRIORITY_HIGHEST,
} from '../utils/constants';

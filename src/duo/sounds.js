import { _, _1, _2, _3, it, lift } from 'one-liner.macro';
import { hasObjectProperty, isNumber, isObject } from '../utils/functions';
import { getUniqueKey, overrideInstanceMethod, overrideOwnPropertyDescriptor } from '../utils/internal';

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
 * A character or a syllable.
 * @type {string}
 */
export const SOUND_TYPE_TTS_MORPHEME = 'tts_morpheme';

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
  SOUND_TYPE_TTS_MORPHEME,
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
 * @type {string}
 */
const FORCED_SETTING_KEY = getUniqueKey('forced_setting');

/**
 * @param {*} value A setting value that was passed to a setter.
 * @returns {boolean} Whether the value is a forced setting value.
 */
const isForcedSettingValue = value => isObject(value) && !!value[FORCED_SETTING_KEY];

/**
 * @type {Function}
 * @param {object} forcedValue A forced setting value.
 * @returns {number} The corresponding base value.
 */
const getForcedSettingBaseValue = _.value;

/**
 * @type {Function}
 * @param {number} A base setting value.
 * @returns {object} The given value, wrapped in a layer that identifies it as a forced value.
 */
const wrapForcedSettingBaseValue = { [FORCED_SETTING_KEY]: true, value: _ };

/**
 * @param {string} code The code of a sound setting.
 * @param {*} value A value for the given setting.
 * @returns {boolean} Whether the value is suitable for being applied to a "Howl" object from the "howler.js" library.
 */
const isValidHowlSettingValue = (code, value) => (
  (SOUND_SETTING_RATE === code) && isNumber(value)
  || (SOUND_SETTING_VOLUME === code) && (value >= 0) && (value <= 1)
);

/**
 * Applies the necessary overrides to ensure that the forced setting values on "Audio" objects are correctly handled,
 * and reapplied / recalculated whenever necessary.
 * @param {string} code The code of a sound setting.
 * @param {string} propertyName The name of the corresponding property on "Audio" objects.
 * @returns {void}
 */
const applyAudioSettingPropertyOverride = (code, propertyName) => (
  overrideOwnPropertyDescriptor(HTMLMediaElement, propertyName, originalDescriptor => ({
    ...originalDescriptor,
    set: function (value) {
      const setting = SOUND_SETTINGS[code];

      if (isNumber(value)) {
        this[setting.originalValueKey] = value;

        if (hasObjectProperty(this, setting.valueKey)) {
          if (!this[setting.isRelativeKey]) {
            value = this[setting.valueKey];
          } else {
            value = clampSoundSettingValue(code, value * this[setting.valueKey]);
          }
        }
      } else if (isForcedSettingValue(value)) {
        value = getForcedSettingBaseValue(value);
      }

      if (isNumber(value)) {
        this[setting.listenerValueKey] = value;
      }

      originalDescriptor.set.call(this, value);
    }
  }))
);

/**
 * Applies the necessary overrides to ensure that the forced setting values on "Howl" objects are correctly handled,
 * and reapplied / recalculated whenever necessary.
 * @param {string} code The code of a sound setting.
 * @param {string} functionName The name of the function usable to manage the setting for "Howl" objects.
 * @returns {void}
 */
const applyHowlSettingFunctionOverride = (code, functionName) => (
  overrideInstanceMethod('Howl', functionName, originalHowlSetter => function () {
    const self = this;
    const args = arguments;
    const setting = SOUND_SETTINGS[code];

    let isForcedValueUpdate = false;
    const originalQueueSize = self._queue.length;

    if (
      (args.length === 1)
      || ((args.length === 2) && (typeof args[1] === 'undefined'))
    ) {
      if (self._getSoundIds().indexOf(args[0]) === -1) {
        if (isForcedSettingValue(args[0])) {
          isForcedValueUpdate = true;
          args[0] = getForcedSettingBaseValue(args[0]);
        } else if (isValidHowlSettingValue(code, args[0])) {
          self[setting.originalValueKey] = args[0];

          if (hasObjectProperty(self, setting.valueKey)) {
            isForcedValueUpdate = true;

            if (!self[setting.isRelativeKey]) {
              args[0] = self[setting.valueKey];
            } else {
              args[0] = clampSoundSettingValue(code, args[0] * self[setting.valueKey]);
            }
          }
        }

        if (isForcedValueUpdate) {
          self[setting.listenerValueKey] = args[0];
        }
      }
    }

    const result = originalHowlSetter.apply(self, arguments);

    if (isForcedValueUpdate && (originalQueueSize < self._queue.length)) {
      self._queue[self._queue.length - 1].action = function () {
        args[0] = wrapForcedSettingBaseValue(args[0]);
        self[functionName](...args);
      };
    }

    return result;
  })
);

/**
 * @param {string} code The code of a sound setting.
 * @param {string} audioPropertyName The name of the corresponding property on "Audio" objects.
 * @param {string} howlFunctionName The name of the corresponding function on "Howl" objects.
 * @param {object} baseConfig The base configuration data for the setting.
 * @returns {object} Full configuration data for the given setting.
 */
const prepareSoundSettingConfig = (code, audioPropertyName, howlFunctionName, baseConfig) => (
  {
    ...baseConfig,
    functions: {
      [SOUND_PLAYBACK_STRATEGY_AUDIO]: {
        applyOverride: () => applyAudioSettingPropertyOverride(code, howlFunctionName),
        getter: lift(_[audioPropertyName]),
        setter: lift(_[audioPropertyName] = _),
        hasQueuedUpdate: () => false,
      },
      [SOUND_PLAYBACK_STRATEGY_HOWLER]: {
        applyOverride: () => applyHowlSettingFunctionOverride(code, howlFunctionName),
        getter: lift(_[howlFunctionName]()),
        setter: lift(it[howlFunctionName](_)),
        hasQueuedUpdate: lift(it._queue.find(it.event === howlFunctionName)),
      },
    },
    priorityKey: getUniqueKey(`${code}_priority`),
    isRelativeKey: getUniqueKey(`${code}_is_relative`),
    valueKey: getUniqueKey(`forced_${code}_value`),
    originalValueKey: getUniqueKey(`original_${code}_value`),
    listenerValueKey: getUniqueKey(`${code}_value`), // This value is used for compatibility with old versions.
  }
);

/**
 * @type {object}
 */
const SOUND_SETTINGS = {
  [SOUND_SETTING_RATE]: prepareSoundSettingConfig(
    SOUND_SETTING_RATE,
    'playbackRate',
    'rate',
    {
      minValue: 0.5,
      maxValue: 4.0,
      defaultValue: 1.0,
    }
  ),
  [SOUND_SETTING_VOLUME]: prepareSoundSettingConfig(
    SOUND_SETTING_VOLUME,
    'volume',
    'volume',
    {
      minValue: 0.0,
      maxValue: 1.0,
      defaultValue: 1.0,
    }
  ),
};

/**
 * @param {string} code The code of a sound setting.
 * @returns {object} The configuration of the sound setting.
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
 * @returns {object} The set of functions that can be used to deal with a given setting for a given type of sounds.
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
export const clampSoundSettingValue = (code, value) => (
  !SOUND_SETTINGS[code]
    ? value
    : Math.max(SOUND_SETTINGS[code].minValue, Math.min(value, SOUND_SETTINGS[code].maxValue))
);

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
 * @param {string} code The code of a sound setting.
 * @param {number} value The new setting value.
 * @param {*} sound A sound object, whose type depends on the playback strategy.
 * @param {string} playbackStrategy The strategy used for playing the sound.
 * @param {boolean} isRelative Whether the forced value should be combined with the original value.
 * @param {?number} priority The priority of the new setting value.
 * @returns {void}
 */
export const setSoundSettingValue = (code, value, sound, playbackStrategy, isRelative = false, priority = 1) => {
  const setting = getSoundSetting(code);

  if (priority >= (Number(sound[setting.priorityKey]) || 0)) {
    const baseValue = clampSoundSettingValue(code, value);
    const functions = getSoundSettingFunctions(code, playbackStrategy);

    functions.applyOverride();

    sound[setting.valueKey] = baseValue;
    sound[setting.priorityKey] = priority;
    sound[setting.isRelativeKey] = isRelative;

    if (!hasObjectProperty(sound, setting.originalValueKey)) {
      sound[setting.originalValueKey] = functions.getter(sound);
    }

    if (!functions.hasQueuedUpdate(sound)) {
      functions.setter(
        sound,
        wrapForcedSettingBaseValue(
          clampSoundSettingValue(
            code,
            baseValue * (!isRelative ? 1 : sound[setting.originalValueKey])
          )
        )
      );
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

import { _, _1, it } from 'one-liner.macro';
import { CXProduct } from 'cxproduct';

/**
 * A function that does nothing.
 *
 * @returns {void}
 */
export const noop = () => {
};

/**
 * @type {Function}
 * @param {*} value A value.
 * @returns {*} The same value.
 */
export const identity = _;

/**
 * @param {Promise} promise A promise to run solely for its effects, discarding its result.
 * @returns {void}
 */
export const runPromiseForEffects = it.then(noop).catch(noop);

/**
 * @type {Function}
 * @param {*} value A value.
 * @returns {boolean} Whether the given value is a valid, finite number.
 */
export const isNumber = ('number' === typeof _1) && Number.isFinite(_1);

/**
 * @type {Function}
 * @param {*} value A value.
 * @returns {boolean} Whether the given value is a string.
 */
export const isString = ('string' === typeof _);

/**
 * @type {Function}
 * @param {*} value The tested value.
 * @returns {boolean} Whether the given value is an array.
 */
export const isArray = Array.isArray;

/**
 * @type {Function}
 * @param {*} value The tested value.
 * @returns {boolean} Whether the given value is an object. This excludes Arrays, but not Dates or RegExps.
 */
export const isObject = ('object' === typeof _1) && !!_1 && !isArray(_1);

/**
 * @type {Function}
 * @param {*} value The tested value.
 * @returns {boolean} Whether the given value is a function.
 */
export const isFunction = ('function' === typeof _);

/**
 * @type {Function}
 * @param {*} value The tested value.
 * @returns {boolean} Whether the given value is a Blob.
 */
export const isBlob = (_1 instanceof Blob) || (Object.prototype.toString.call(_1) === '[object Blob]');

/**
 * @type {Function}
 * @param {object} Object The tested object.
 * @param {string} name The name of a property.
 * @returns {boolean} Whether the given object has the specified property as its own.
 */
export const hasObjectProperty = Object.prototype.hasOwnProperty.call(_, _);

/**
 * @param {object} object A Plain Old Javascript Object.
 * @returns {boolean} Whether the given object is empty.
 */
export const isEmptyObject = object => {
  for (let key in object) {
    if (hasObjectProperty(object, key)) {
      return false;
    }
  }

  return true;
}

/**
 * @type {Function}
 * @param {Array} xs An array.
 * @param {Array} ys Another array.
 * @returns {boolean} Whether the first array is a superset of the second.
 */
export const isSupersetOf = _.every(_.indexOf(_) >= 0);

/**
 * @param {Function[]} comparators The proper comparators to use in order, as long as the two values are deemed equal.
 * @param {*} x A value.
 * @param {*} y Another value.
 * @returns {number}
 * A number:
 * - < 0 if x <  y,
 * - > 0 if x >  y,
 * -   0 if x == y.
 */
export const compareWith = (comparators, x, y) => {
  for (const comparator of comparators) {
    const result = Number(comparator(x, y));

    if (!isNaN(result) && (result !== 0)) {
      return result;
    }
  }

  return 0;
};

/**
 * @type {Function}
 * @param {*} x A value.
 * @param {*} y Another value.
 * @returns {boolean} Whether the first value is larger than the second.
 */
const gt = (_ > _);

/**
 * @type {Function}
 * @param {*} x A value.
 * @param {*} y Another value.
 * @returns {boolean} Whether the first value is smaller than the second.
 */
const lt = (_ < _);

/**
 * @param {Function} comparator A comparison function.
 * @returns {Function} The inverse of the given comparison function.
 */
export const invertComparison = comparator => (x, y) => {
  const result = comparator(x, y);
  return (result < 0) ? 1 : ((result > 0) ? -1 : 0);
}

/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare.
 * @param {Function} comparator A function usable to compare any two calculated values, and determine which one to keep.
 * @returns {*|undefined} The (first) value from the list whose corresponding calculated value was selected.
 */
export const extremumBy = (values, getter, comparator) => {
  let selected;
  let extremum;

  if (isArray(values)) {
    for (let i = 0, l = values.length; i < l; i++) {
      const calculated = getter(values[i]);

      if ((undefined === extremum) || comparator(calculated, extremum)) {
        selected = values[i];
        extremum = calculated;
      }
    }
  }

  return selected;
};

/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare.
 * @returns {*|undefined} The (first) value from the list whose corresponding calculated value is the largest.
 */
export const maxBy = extremumBy(_, _, gt);

/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare and return.
 * @returns {*|undefined} The largest calculated value from the values in the list.
 */
export const maxOf = (values, getter) => {
  const value = maxBy(values, getter);
  return (undefined === value) ? value : getter(value);
}

/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @returns {*|undefined} The (first) largest value in the list.
 */
export const max = maxOf(_, identity);

/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare.
 * @returns {*|undefined} The (first) value from the list whose corresponding calculated value is the smallest.
 */
export const minBy = extremumBy(_, _, lt);

/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to compare and return.
 * @returns {*|undefined} The smallest calculated value from the values in the list.
 */
export const minOf = (values, getter) => {
  const value = minBy(values, getter);
  return (undefined === value) ? value : getter(value);
}

/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @returns {*|undefined} The (first) smallest value from the list.
 */
export const min = minOf(_, identity);

/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values to be summed up.
 * @returns {number} The sum of the calculated values from the values in the list.
 */
export const sumOf = (values, getter) => values.reduce((result, value) => result + getter(value), 0);

/**
 * @type {Function}
 * @param {number[]} values A list of numbers.
 * @returns {number} The sum of the numbers in the list.
 */
export const sum = sumOf(_, identity);

/**
 * @param {Array} values A list of values.
 * @param {Function} getter A getter for the calculated values on which to group the values in the list.
 * @returns {Object<string, Array>} An object from calculated values to the corresponding subset of original values.
 */
export const groupBy = (values, getter) => {
  const result = {};

  for (let i = 0, l = values.length; i < l; i++) {
    const value = values[i];
    const key = String(getter(value));

    if (!(key in result)) {
      result[key] = [];
    }

    result[key].push(values[i])
  }

  return result;
}

/**
 * @param {Array} values A list of values.
 * @param {Function} predicate A predicate.
 * @returns {[ Array, Array ]} A pair of lists: first the values that match the predicate, then those that do not.
 */
export const partition = (values, predicate) => {
  const result = [ [], [] ];

  for (let i = 0, l = values.length; i < l; i++) {
    result[predicate(values[i]) ? 0 : 1].push(values[i]);
  }

  return result;
};

/**
 * @param {Array[]} xss A list of arrays.
 * @returns {Array[]} The cartesian product of the given arrays.
 */
export const cartesianProduct = xss => {
  const result = [];  
  const product = CXProduct(xss);
  product.forEach(result.push(_));

  return result;
};

/**
 * @param {Array} values A list of values.
 * @param {Function} choose
 * A function that will be applied to values whose calculated value is strictly equal.
 * Should return:
 * - -1 to keep the first value,
 * - +1 to keep the second value.
 * @param {Function} map
 * A function that will be applied to the values before comparing them for strict equality.
 * @returns {Array} The given list of values, in which equivalent values have been deduplicated.
 */
export function dedupeBy(values, choose, map = identity) {
  if (values.length <= 1) {
    return values.slice();
  }

  const deduped = new Map();

  for (const value of values) {
    const key = map(value);

    if (deduped.has(key)) {
      const choice = choose(deduped.get(key), value, key);

      if (choice === 1) {
        deduped.delete(key);
        deduped.set(key, value);
      }
    } else {
      deduped.set(key, value);
    }
  }

  return Array.from(deduped.values());
}

/**
 * @param {Array} values A list of values.
 * @param {Function} choose
 * A function that will be applied to adjacent values whose calculated value is strictly equal.
 * Should return:
 * - -1 to keep only the left value,
 * -  0 to keep both values,
 * - +1 to keep only the right value.
 * @param {Function} map
 * A function that will be applied to the values before comparing them for strict equality.
 * @returns {Array} The given list of values, in which equivalent adjacent values have been deduplicated.
 */
export function dedupeAdjacentBy(values, choose, map = identity) {
  if (values.length <= 1) {
    return values.slice();
  }

  const result = [];
  let baseIndex = 0;
  let left = map(values[0]);

  for (let i = 1, l = values.length; i < l; i++) {
    const right = map(values[i]);

    const choice = (left !== right)
      ? 0
      : choose(values[baseIndex], values[i], left);

    if (-1 !== choice) {
      if (0 === choice) {
        result.push(values[baseIndex]);
      }

      left = right;
      baseIndex = i;
    }
  }

  result.push(values[baseIndex]);

  return result;
}

/**
 * @type {Function}
 * @param {Array} values A list of values.
 * @returns {Array} The given list of values, in which equal adjacent values have been deduplicated.
 */
export const dedupeAdjacent = dedupeAdjacentBy(_, () => -1);

/**
 * @param {Function} mergeValues A function usable to merge any two values.
 * @param {Map[]} maps A list of maps.
 * @returns {Map}
 * A new map that contains all the keys of the given maps.
 * If a key occurs in two or more maps, the given function will be used to merge the corresponding values.
 */
export const mergeMapsWith = (mergeValues, ...maps) => {
  const result = new Map();
  const [ base, ...additional ] = maps;

  for (const [ key, value ] of base) {
    result.set(key, value);
  }

  for (const map of additional) {
    for (const [ key, value ] of map) {
      const existing = result.get(key);
      result.set(key, existing === undefined ? value : mergeValues(existing, value));
    }
  }

  return result;
};

/**
 * @type {Function}
 * @param {string} value A string.
 * @returns {string} The given string, with all RegExp characters escaped.
 */
export const escapeRegExp = it.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @param {number} delay A delay, in milliseconds.
 * @returns {Promise<void>} A promise for when the delay is elapsed.
 */
export const sleep = delay => new Promise(resolve => setTimeout(resolve, delay));

/**
 * @param {string} url A URL of any shape.
 * @returns {string} The corresponding path.
 */
export const getUrlPath = url => {
  let path = null;

  if (url.charAt(0) === '/') {
    if (url.charAt(1) === '/') {
      url = `https://${url}`;
    } else {
      path = url;
    }
  }

  if (null === path) {
    try {
      path = new URL(url).pathname;
    } catch (error) {
      path = url;
    }
  }

  return path;
};

import { bumpGlobalCounter } from './internal';
/**
 * @param {string[]} selectors A list of selectors.
 * @returns {Element|null} The first element to match any of the selectors, tested in order.
 */

export const querySelectors = selectors => {
  for (let i = 0; i < selectors.length; i++) {
    const element = document.querySelector(selectors[i]);

    if (element instanceof Element) {
      return element;
    }
  }

  return null;
};
/**
 * @param {Event} event The UI event to discard.
 * @returns {void}
 */

export const discardEvent = event => {
  event.preventDefault();
  event.stopPropagation();
};
/**
 * @returns {boolean} Whether the currently focused element (if any) is an input (<input>, <select> or <textarea>).
 */

export const isAnyInputFocused = () => !document.activeElement ? false : ['input', 'select', 'textarea'].indexOf(document.activeElement.tagName.toLowerCase()) >= 0;
/**
 * @returns {Element|null} The currently focused input (<input>, <select> or <textarea>), if any.
 */

export const getFocusedInput = () => isAnyInputFocused() ? document.activeElement : null;
/**
 * @param {string} prefix The prefix to prepend to the generated ID.
 * @returns {string} A unique / unused element ID.
 */

export const getUniqueElementId = prefix => {
  let elementId;

  do {
    elementId = `${prefix}-${bumpGlobalCounter('last_element_id')}`;
  } while (document.getElementById(elementId));

  return elementId;
};
/**
 * @param {Element} element The element to toggle.
 * @param {boolean|null} forceDisplayed If not null, the state of the element to enforce.
 * @returns {void}
 */

export const toggleElementDisplay = (element, forceDisplayed = null) => {
  if (element instanceof Element) {
    if (element.style.display === 'none') {
      if (false !== forceDisplayed) {
        element.style.display = '';
      }
    } else if (true !== forceDisplayed) {
      element.style.display = 'none';
    }
  }
};
/**
 * @param {Element} element An element.
 * @returns {boolean} Whether the given element has an overflow behavior that uses scrollbars.
 */

export const hasElementScrollOverflow = element => {
  try {
    const {
      overflow,
      overflowX,
      overflowY
    } = getComputedStyle(element);
    return /(auto|scroll)/i.test(overflow + overflowX + overflowY);
  } catch (error) {
    return false;
  }
};
/**
 * @param {Element} element An element.
 * @returns {Node[]} The ancestors of the given element that have an overflow behavior that uses scrollbars.
 */

export const getAncestorsWithScrollOverflow = element => {
  let parent = element.parentElement;
  const matchedParents = [document];

  while (parent && parent !== document.body) {
    hasElementScrollOverflow(parent) && matchedParents.push(parent);
    parent = parent.parentElement;
  }

  return matchedParents;
};
/**
 * @param {Element} element An element.
 * @param {Element} ancestor An ancestor of the element.
 * @returns {{x: number, y: number}} The offset of the element in its given ancestor.
 */

export const getOffsetInAncestor = (element, ancestor) => {
  let x = 0;
  let y = 0;

  if (ancestor.contains(element)) {
    let parent = element.offsetParent;

    while (parent) {
      x += element.offsetLeft;
      y += element.offsetTop;
      element = parent;
      parent = parent.offsetParent;

      if (!ancestor.contains(parent)) {
        break;
      }
    }
  }

  return {
    x,
    y
  };
};
/**
 * @param {Element} element An element.
 * @param {number} threshold The minimum vertical scroll height that we are interested in.
 * @returns {Element|null} The first ancestor of the given element that has a matching vertical scrollbar, if any.
 */

export const getAncestorWithVerticalScrollbar = (element, threshold = 10) => {
  let ancestor = element.parentElement;

  while (ancestor) {
    if (ancestor.clientHeight > 0 && ancestor.scrollHeight - threshold > ancestor.clientHeight && (document.documentElement === ancestor || ['hidden', 'visible'].indexOf(window.getComputedStyle(ancestor).overflowY) === -1)) {
      return ancestor;
    }

    ancestor = ancestor.parentElement;
  }

  return null;
};
/**
 * Scrolls an element to the top of its first scrollable ancestor, if it is not entirely visible already.
 *
 * This function does not ensure that the element is actually visible in the current viewport.
 *
 * @param {Element} element An element.
 * @param {number} margin The margin to preserve between the top of the parent and the element itself.
 * @param {string} behavior The scroll behavior ("auto" or "smooth").
 * @returns {void}
 */

export const scrollElementIntoParentView = (element, margin = 0, behavior = 'auto') => {
  const ancestor = getAncestorWithVerticalScrollbar(element);

  if (!ancestor) {
    return;
  }

  const offset = getOffsetInAncestor(element, ancestor).y;

  if (offset < ancestor.scrollTop + margin || offset + element.clientHeight > ancestor.scrollTop + ancestor.clientHeight) {
    ancestor.scrollTo({
      top: offset - margin,
      behavior
    });
  }
};
/**
 * @param {Element} element A fixed position element
 * @returns {Element|null} The parent of the given element that has an effect on its position, if any.
 */

export const getFixedElementPositioningParent = element => {
  let parent = element.parentElement;

  while (parent && parent !== document.body) {
    const styles = window.getComputedStyle(parent);

    if (styles.getPropertyValue('transform') !== 'none') {
      return parent;
    }

    parent = parent.parentElement;
  }

  return null;
};
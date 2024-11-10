// src/utils/utils.js

/**
 * Combines multiple class names into a single string, filtering out any falsy values.
 * This is helpful for conditionally applying class names in React components.
 *
 * @param {...string} classes - List of class names to combine.
 * @returns {string} - A single string with all valid class names.
 */
export function cn(...classes) {
    return classes.filter(Boolean).join(" ");
  }
  
// utils/formatters.js

/**
 * Extracts a date string (e.g., "10/19/2025") from a full event name.
 * @param {string} eventName - The full name of the event.
 * @returns {string|null} The date string if found, otherwise null.
 */
export const extractDateFromEventName = (eventName) => {
  if (!eventName) return null;
  const dateMatch = eventName.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/);
  return dateMatch ? dateMatch[1] : null;
};

/**
 * Removes the date portion (e.g., "(10/19/2025)") from an event name for a cleaner display.
 * @param {string} eventName - The full name of the event.
 * @returns {string} The event name without the date.
 */
export const stripDateFromEventName = (eventName) => {
  if (!eventName) return '';
  // This regex finds a space followed by the date in parentheses and removes it.
  return eventName.replace(/\s*\(\d{1,2}\/\d{1,2}\/\d{4}\)/, '').trim();
};
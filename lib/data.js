// lib/data.js
import fs from 'fs';
import path from 'path';
// This simple in-memory cache will store the data after the first read.
let cache;

/**
 * A cached function to load and parse the core data files for the application.
 * During a build (`next build`), this function reads from the disk only on its
 * very first call. All subsequent calls within the same build process will
 * return the already-loaded data from memory instantly.
 *
 * @returns {{leaderboardData: Array, historyDataAll: Array}} An object containing the parsed JSON data.
 */
export function loadData() {
  // If the cache variable has been populated, return it immediately.
  if (cache) {
    return cache;
  }

  // If the cache is empty, this is the first time the function is being called
  // during this build process.
  console.log('Performing one-time data load from disk...');

  const publicDirectory = path.join(process.cwd(), 'public');
  
  const leaderboardData = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'final_leaderboard.json'), 'utf8'));
  const historyDataAll = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'rating_history_full.json'), 'utf8'));

  // Store the loaded data in the cache variable for future calls.
  cache = { leaderboardData, historyDataAll };
  
  return cache;
}
// data/logoMatcher.js

/**
 * A map for any logos that need an EXACT match to a full event name.
 * This is perfect for special events that should override the general rules.
 * For example: "Minecraft Championship Pride 22"
 */
const specificLogos = {
  // Add specific, full event names here if needed
  // "Example Special Event Name": "/logos/example-special-event.png",
};

/**
 * This function intelligently finds the correct logo path for a given event name.
 * It checks for specific overrides first, then for general keywords.
 * @param {string} eventName - The full name of the event from your data.
 * @returns {string} The path to the correct logo image.
 */
export function getLogoForEvent(eventName) {
  // 1. Check for a specific override first.
  if (specificLogos[eventName]) {
    return specificLogos[eventName];
  }

  // 2. Check for keywords. The order matters if names overlap.
  //    Place more specific keywords (like "Twitch Rivals") before more generic ones.
  const name = eventName.toLowerCase();

  if (name.includes('block wars')) {
    return '/logos/block-wars.png';
  }
  if (name.includes('minecraft championship')) {
    return '/logos/minecraft-championship.png';
  }
   if (name.includes('cube championships')) {
    return '/logos/cube-championships.png';
  }
  if (name.includes('pandora\'s box')) {
    return '/logos/pandoras-box.png';
  }
    if (name.includes('minecraft mayhem')) {
    return '/logos/minecraft-mayhem.png';
  }  if (name.includes('blissful championships')) {
    return '/logos/blissful-championship.png';
  }  if (name.includes('jackcas game nights')) {
    return '/logos/jackcas.png';
  }  if (name.includes('chamber trials')) {
    return '/logos/chamber-trials.png';
  }  if (name.includes('biome battle')) {
    return '/logos/biome-battle.png';
  }  if (name.includes('klyx games')) {
    return '/logos/klyx-games.png';
  }  if (name.includes('fusion frenzy')) {
    return '/logos/fusion-frenzy.png';
  }  if (name.includes('showdown')) {
    return '/logos/showdown.png';
  } 

  // --- ADD NEW RULES FOR OTHER EVENT SERIES HERE ---
  // if (name.includes('another event series')) {
  //   return '/logos/another-event-series.png';
  // }
  
  // 3. If no matches are found, return the path to the default logo.
  return '/logos/default-event.png';
}
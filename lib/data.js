// lib/data.js

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

    const fs = require('fs');
  const path = require('path');
  const publicDirectory = path.join(process.cwd(), 'public');
  
  const leaderboardData = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'final_leaderboard.json'), 'utf8'));
  const historyDataAll = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'rating_history_full.json'), 'utf8'));

  // Store the loaded data in the cache variable for future calls.
  cache = { leaderboardData, historyDataAll };
  
  return cache;
}
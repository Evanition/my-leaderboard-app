// pages/index.js

"use client";

import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { slugify } from '../utils/slugify';
import UnoptimizedAvatar from '../components/UnoptimizedAvatar';
import EventLogo from '../components/EventLogo';

/**
 * A helper function that extracts a date string (e.g., "10/19/2025")
 * from a full event name string.
 * @param {string} eventName - The full name of the event.
 * @returns {string|null} The date string if found, otherwise null.
 */
const extractDateFromEventName = (eventName) => {
  if (!eventName) return null;
  // This regular expression looks for a pattern like (MM/DD/YYYY)
  const dateMatch = eventName.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/);
  return dateMatch ? dateMatch[1] : null; // Return the captured date part, or null
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('players');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [historyDataAll, setHistoryDataAll] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaderboardRes, historyRes] = await Promise.all([
          fetch('/final_leaderboard.json'),
          fetch('/rating_history_full.json')
        ]);
        const leaderboardJson = await leaderboardRes.json();
        const historyJson = await historyRes.json();
        setLeaderboardData(leaderboardJson);
        setHistoryDataAll(historyJson);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredPlayers = useMemo(() => {
    return leaderboardData.filter(player =>
      player.Player_Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leaderboardData, searchQuery]);

  // This hook processes the event data into a more usable format and sorts it.
  const uniqueEvents = useMemo(() => {
    if (historyDataAll.length === 0) return [];
    
    const allEventNames = historyDataAll.map(entry => entry.event_name);
    const uniqueNames = [...new Set(allEventNames)].filter(name => name && name !== "Rating Decay");

    // Convert the array of names into an array of objects
    return uniqueNames
      .map(name => ({
        name: name,
        date: extractDateFromEventName(name),
        // Create a proper JavaScript Date object for reliable sorting
        sortableDate: extractDateFromEventName(name) ? new Date(extractDateFromEventName(name)) : null,
      }))
      .sort((a, b) => {
        // Sort by the new Date object, with the newest events first.
        if (a.sortableDate && b.sortableDate) return b.sortableDate - a.sortableDate;
        // If one has a date and the other doesn't, prioritize the one with the date.
        if (b.sortableDate) return 1;
        if (a.sortableDate) return -1;
        // Fallback to alphabetical sorting if no dates are present.
        return b.name.localeCompare(a.name);
      });
  }, [historyDataAll]);

  // This hook filters the processed events based on the search query.
  const filteredEvents = useMemo(() => {
    return uniqueEvents.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueEvents, searchQuery]);

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Minecraft Event ELO</h1>
          <p>Loading data...</p>
        </main>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Minecraft Event ELO</title>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Minecraft Event ELO</h1>

        <div className={styles.searchToggle}>
          <button
            className={`${styles.toggleButton} ${searchMode === 'players' ? styles.toggleButtonActive : ''}`}
            onClick={() => setSearchMode('players')}
          >
            Players
          </button>
          <button
            className={`${styles.toggleButton} ${searchMode === 'events' ? styles.toggleButtonActive : ''}`}
            onClick={() => setSearchMode('events')}
          >
            Events
          </button>
        </div>

        <input
          type="text"
          placeholder={searchMode === 'players' ? 'Search players...' : 'Search events...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.gantt.value)}
          className={styles.searchInput}
        />

        {searchMode === 'players' ? (
          <div className={styles.tableWrapper}>
            <table className={styles.leaderboardTable}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => (
                  <tr key={player.Rank}>
                    <td>{player.Rank}</td>
                    <td>
                      <div className={styles.playerCell}>
                        <UnoptimizedAvatar
                          playerName={player.Player_Name}
                          alt={`${player.Player_Name}'s skin`}
                          width={32}
                          height={32}
                          className={styles.playerAvatar}
                        />
                        <Link href={`/player/${encodeURIComponent(player.Player_Name)}`}>
                          {player.Player_Name}
                        </Link>
                      </div>
                    </td>
                    <td>{parseFloat(player.Rating).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <ul className={styles.eventList}>
              {filteredEvents.map((event) => (
                <li key={event.name}>
                  <Link href={`/event/${slugify(event.name)}`} className={styles.eventLink}>
                    {/* Left side with logo and name */}
                    <div className={styles.eventDetails}>
                      <EventLogo eventName={event.name} />
                      <span>{event.name}</span>
                    </div>
                    {/* Right side with the date (only renders if a date exists) */}
                    {event.date && <span className={styles.eventDate}>{event.date}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
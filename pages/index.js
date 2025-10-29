"use client";

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react'; // Import useEffect
import styles from '../styles/Home.module.css';
// We no longer import the data directly
// import leaderboardData from '../data/final_leaderboard.json';
// import historyDataAll from '../data/rating_history_full.json';
import { slugify } from '../utils/slugify';
import EventLogo from '../components/EventLogo';

export default function Home() {
  // State for search and UI toggling
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('players');

  // State to hold the data fetched from the JSON files
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [historyDataAll, setHistoryDataAll] = useState([]);
  const [loading, setLoading] = useState(true); // Loading state

  // useEffect to fetch data when the component mounts
  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch both files concurrently
        const [leaderboardRes, historyRes] = await Promise.all([
          fetch('/final_leaderboard.json'), // Path is relative to the public folder
          fetch('/rating_history_full.json')
        ]);

        const leaderboardJson = await leaderboardRes.json();
        const historyJson = await historyRes.json();

        setLeaderboardData(leaderboardJson);
        setHistoryDataAll(historyJson);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        // Optionally, set an error state here
      } finally {
        setLoading(false); // Set loading to false once done
      }
    }

    fetchData();
  }, []); // The empty dependency array ensures this runs only once on mount

  // Memoized calculation for filtered players
  const filteredPlayers = useMemo(() => {
    const playersArray = Array.isArray(leaderboardData) ? leaderboardData : Object.values(leaderboardData);
    return playersArray.filter(player =>
      player.Player_Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leaderboardData, searchQuery]); // Re-calculates when data or search query changes

  // Memoized calculation for unique events
  const uniqueEvents = useMemo(() => {
    if (historyDataAll.length === 0) return []; // Guard against empty data
    
    const allEventNames = historyDataAll.map(entry => entry.event_name);
    const uniqueNames = [...new Set(allEventNames)].filter(name => name !== "Rating Decay");

    const getDateFromEventName = (eventName) => {
      const dateMatch = eventName.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/);
      if (dateMatch && dateMatch[1]) {
        return new Date(dateMatch[1]);
      }
      return null;
    };

    return uniqueNames.sort((a, b) => {
      const dateA = getDateFromEventName(a);
      const dateB = getDateFromEventName(b);
      if (dateA && dateB) return dateB - dateA;
      if (dateB) return 1;
      if (dateA) return -1;
      return b.localeCompare(a);
    });
  }, [historyDataAll]); // Re-calculates when history data changes

  const filteredEvents = useMemo(() => {
    return uniqueEvents.filter(eventName =>
      eventName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueEvents, searchQuery]);

  // Show a loading indicator while fetching data
  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <h1 className={styles.title}>Minecraft Event ELO</h1>
          <p>Loading leaderboard...</p>
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
          onChange={(e) => setSearchQuery(e.target.value)}
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
                        <Image
                          src={`https://cravatar.eu/avatar/${player.Player_Name}/32`}
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
              {filteredEvents.map((eventName) => (
                <li key={eventName}>
                  <Link href={`/event/${slugify(eventName)}`} className={styles.eventLink}>
                  <div className={styles.eventItemContent}>
                    <EventLogo eventName={eventName} />
                    <span>{eventName}</span>
                  </div>
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
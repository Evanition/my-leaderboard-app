// pages/index.js

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { slugify } from '../utils/slugify';
import EventLogo from '../components/EventLogo';

// We import the data directly. In a CSR pattern, this data is part of the initial JS bundle.
// The "client-side" part is processing and rendering it after the component mounts.
import leaderboardData from '../public/final_leaderboard.json';
import historyDataAll from '../public/rating_history_full.json';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('players');
  const [loading, setLoading] = useState(true);

  // State to hold our processed data
  const [allPlayers, setAllPlayers] = useState([]);
  const [uniqueEvents, setUniqueEvents] = useState([]);

  useEffect(() => {
    // This effect runs once on the client-side after the component mounts.
    // Here, we process the data that was bundled with the component.
    const playersArray = Array.isArray(leaderboardData) ? leaderboardData : Object.values(leaderboardData);
    setAllPlayers(playersArray);

    const allEventNames = historyDataAll.map(entry => entry.event_name);
    const uniqueNames = [...new Set(allEventNames)].filter(name => name !== "Rating Decay");

    const getDateFromEventName = (eventName) => {
      const dateMatch = eventName.match(/\((\d{1,2}\/\d{1,2}\/\d{4})\)/);
      return dateMatch && dateMatch[1] ? new Date(dateMatch[1]) : null;
    };

    const sortedUniqueNames = uniqueNames.sort((a, b) => {
      const dateA = getDateFromEventName(a);
      const dateB = getDateFromEventName(b);
      if (dateA && dateB) return dateB - dateA;
      return b.localeCompare(a);
    });
    setUniqueEvents(sortedUniqueNames);
    
    setLoading(false); // Data is ready
  }, []); // Empty array means this effect runs only once

  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return allPlayers;
    return allPlayers.filter(player =>
      player.Player_Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allPlayers, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return uniqueEvents;
    return uniqueEvents.filter(eventName =>
      eventName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueEvents, searchQuery]);

  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}><h1 className={styles.title}>Loading...</h1></main>
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
                          unoptimized // <-- ADD THIS PROP
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
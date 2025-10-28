import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import styles from '../styles/Home.module.css';
import leaderboardData from '../data/final_leaderboard.json';
import historyDataAll from '../data/rating_history_full.json';
import { slugify } from '../utils/slugify';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('players');

  const playersArray = Array.isArray(leaderboardData) ? leaderboardData : Object.values(leaderboardData);
  const filteredPlayers = playersArray.filter(player =>
    player.Player_Name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueEvents = useMemo(() => {
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
  }, []);

  const filteredEvents = uniqueEvents.filter(eventName =>
    eventName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <Head>
        {/* MODIFICATION: Changed the browser tab title */}
        <title>Minecraft Event ELO</title>
      </Head>

      <main className={styles.main}>
        {/* MODIFICATION: Changed the main page title */}
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
                    {eventName}
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
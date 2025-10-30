// pages/index.js

"use client";

import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { slugify } from '../utils/slugify';
import { extractDateFromEventName, stripDateFromEventName } from '../utils/formatters';
import UnoptimizedAvatar from '../components/UnoptimizedAvatar';
import EventLogo from '../components/EventLogo';

const getDifficultyTier = (avgRating) => {
  if (!avgRating) return { tier: 'Unknown', className: styles.tierUnknown };
  if (avgRating >= 1600) return { tier: 'Legendary', className: styles.tierLegendary };
  if (avgRating >= 1500) return { tier: 'Master', className: styles.tierMaster };
  if (avgRating >= 1400) return { tier: 'Expert', className: styles.tierExpert };
  if (avgRating >= 1300) return { tier: 'Skilled', className: styles.tierSkilled };
  if (avgRating >= 1200) return { tier: 'Advanced', className: styles.tierAdvanced };
  if (avgRating >= 1100) return { tier: 'Proficient', className: styles.tierProficient };
  if (avgRating >= 1000) return { tier: 'Intermediate', className: styles.tierIntermediate };
  if (avgRating >= 900) return { tier: 'Developing', className: styles.tierDeveloping };
  if (avgRating >= 800) return { tier: 'Apprentice', className: styles.tierApprentice };
  if (avgRating >= 700) return { tier: 'Beginner', className: styles.tierBeginner };
  if (avgRating >= 600) return { tier: 'Novice', className: styles.tierNovice };
  return { tier: 'Noob', className: styles.tierNoob };
};

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('players');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [historyDataAll, setHistoryDataAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playerSort, setPlayerSort] = useState('current');
  const [eventSort, setEventSort] = useState('newest');

  useEffect(() => {
    async function fetchData() {
      try {
        const [leaderboardRes, historyRes] = await Promise.all([
          fetch('/final_leaderboard.json'),
          fetch('/rating_history_full.json')
        ]);
        setLeaderboardData(await leaderboardRes.json());
        setHistoryDataAll(await historyRes.json());
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const playerDataWithPeak = useMemo(() => {
    if (leaderboardData.length === 0 || historyDataAll.length === 0) return [];
    const peakRatings = new Map();
    for (const entry of historyDataAll) {
      const rating = parseFloat(entry.rating_after);
      if (isNaN(rating)) continue;
      const currentPeak = peakRatings.get(entry.player_name) || 0;
      if (rating > currentPeak) {
        peakRatings.set(entry.player_name, rating);
      }
    }
    return leaderboardData.map(player => ({
      ...player,
      peakRating: peakRatings.get(player.Player_Name) || player.Rating,
    }));
  }, [leaderboardData, historyDataAll]);

  const eventDifficultyMap = useMemo(() => {
    if (historyDataAll.length === 0) return new Map();
    const events = new Map();
    for (const entry of historyDataAll) {
      if (!entry.event_name || entry.event_name === "Rating Decay") continue;
      if (!events.has(entry.event_name)) {
        events.set(entry.event_name, { totalRating: 0, playerCount: 0 });
      }
      const eventData = events.get(entry.event_name);
      const rating = parseFloat(entry.rating_after);
      if (!isNaN(rating)) {
        eventData.totalRating += rating;
        eventData.playerCount += 1;
      }
    }
    for (const [eventName, data] of events.entries()) {
      const avgRating = data.playerCount > 0 ? data.totalRating / data.playerCount : 0;
      data.averageRating = avgRating;
      data.difficulty = getDifficultyTier(avgRating);
    }
    return events;
  }, [historyDataAll]);

  const uniqueEvents = useMemo(() => {
    // --- THIS IS THE KEY FIX ---
    // This guard clause prevents the hook from running until its dependencies are ready.
    if (historyDataAll.length === 0 || !eventDifficultyMap) {
      return [];
    }
    
    const uniqueNames = [...new Set(historyDataAll.map(e => e.event_name))];
    
    return uniqueNames
      .filter(name => name && name !== "Rating Decay")
      .map(name => {
        const eventData = eventDifficultyMap.get(name);
        return {
          name: name,
          cleanedName: stripDateFromEventName(name),
          date: extractDateFromEventName(name),
          difficulty: eventData?.difficulty || getDifficultyTier(null),
          averageRating: eventData?.averageRating || 0,
          sortableDate: extractDateFromEventName(name) ? new Date(extractDateFromEventName(name)) : null,
        };
      })
      .sort((a, b) => {
        if (eventSort === 'difficulty') {
          return (b.averageRating || 0) - (a.averageRating || 0);
        }
        if (a.sortableDate && b.sortableDate) return b.sortableDate - a.sortableDate;
        if (b.sortableDate) return 1;
        if (a.sortableDate) return -1;
        return b.name.localeCompare(a.name);
      });
  }, [historyDataAll, eventDifficultyMap, eventSort]);

  const filteredPlayers = useMemo(() => {
    const sortedPlayers = [...playerDataWithPeak].sort((a, b) => {
      if (playerSort === 'peak') {
        return b.peakRating - a.peakRating;
      }
      return a.Rank - b.Rank;
    });
    return sortedPlayers.filter(player =>
      player.Player_Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [playerDataWithPeak, searchQuery, playerSort]);

  const filteredEvents = useMemo(() => {
    // This hook will now work correctly because uniqueEvents is guaranteed to be a valid array.
    return uniqueEvents.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [uniqueEvents, searchQuery]);

  if (loading) {
    return (
        <main className={styles.main}>
          <h1 className={styles.title}>Minecraft Event ELO</h1>
          <p>Loading data...</p>
        </main>
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
          <button className={`${styles.toggleButton} ${searchMode === 'players' ? styles.toggleButtonActive : ''}`} onClick={() => setSearchMode('players')}>Players</button>
          <button className={`${styles.toggleButton} ${searchMode === 'events' ? styles.toggleButtonActive : ''}`} onClick={() => setSearchMode('events')}>Events</button>
        </div>
        <input type="text" placeholder={searchMode === 'players' ? 'Search players...' : 'Search events...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={styles.searchInput} />
        {searchMode === 'players' ? (
          <>
            <div className={styles.sortToggle}>
              <span>Sort by:</span>
              <button className={`${styles.sortButton} ${playerSort === 'current' ? styles.sortButtonActive : ''}`} onClick={() => setPlayerSort('current')}>Current Rating</button>
              <button className={`${styles.sortButton} ${playerSort === 'peak' ? styles.sortButtonActive : ''}`} onClick={() => setPlayerSort('peak')}>Peak Rating</button>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.leaderboardTable}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Player</th>
                    <th>{playerSort === 'peak' ? 'Peak Rating' : 'Rating'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPlayers.map((player, index) => (
                    <tr key={player.Player_Name}>
                      <td>{index + 1}</td>
                      <td>
                        <div className={styles.playerCell}>
                          <UnoptimizedAvatar playerName={player.Player_Name} alt={`${player.Player_Name}'s skin`} width={32} height={32} className={styles.playerAvatar} />
                          <Link href={`/player/${encodeURIComponent(player.Player_Name)}`}>
                            {player.Player_Name}
                          </Link>
                        </div>
                      </td>
                      <td>
                        {playerSort === 'peak'
                          ? parseFloat(player.peakRating).toFixed(2)
                          : parseFloat(player.Rating).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <>
            <div className={styles.sortToggle}>
              <span>Sort by:</span>
              <button className={`${styles.sortButton} ${eventSort === 'newest' ? styles.sortButtonActive : ''}`} onClick={() => setEventSort('newest')}>Newest</button>
              <button className={`${styles.sortButton} ${eventSort === 'difficulty' ? styles.sortButtonActive : ''}`} onClick={() => setEventSort('difficulty')}>Highest Difficulty</button>
            </div>
            <div className={styles.tableWrapper}>
              <ul className={styles.eventList}>
                {filteredEvents.map((event) => (
                  <li key={event.name}>
                    <Link href={`/event/${slugify(event.name)}`} className={styles.eventLink}>
                      <div className={styles.eventDetails}>
                        <EventLogo eventName={event.name} />
                        <div className={styles.eventNameAndDifficulty}>
                          <span>{event.cleanedName}</span>
                          <div className={styles.difficultyContainer}>
                            <span className={`${styles.difficultyTag} ${event.difficulty.className}`}>
                              {event.difficulty.tier}
                            </span>
                            <span className={styles.averageElo}>
                              {event.averageRating.toFixed(2)} Avg ELO
                            </span>
                          </div>
                        </div>
                      </div>
                      {event.date && <span className={styles.eventDate}>{event.date}</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
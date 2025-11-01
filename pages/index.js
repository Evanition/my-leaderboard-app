// pages/index.js

"use client";

import Head from 'next/head';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import styles from '../styles/Home.module.css';
import { slugify } from '../utils/slugify';
import { extractDateFromEventName, stripDateFromEventName } from '../utils/formatters';
import UnoptimizedAvatar from '../components/UnoptimizedAvatar';
import EventLogo from '../components/EventLogo';

// This helper function needs to be outside the component to be used in getStaticProps
const getDifficultyTier = (avgRating) => {
  if (!avgRating) return { tier: 'Unknown', className: 'tierUnknown' }; // Use strings for class names
  if (avgRating >= 1600) return { tier: 'Legendary', className: 'tierLegendary' };
  if (avgRating >= 1500) return { tier: 'Master', className: 'tierMaster' };
  if (avgRating >= 1400) return { tier: 'Expert', className: 'tierExpert' };
  if (avgRating >= 1300) return { tier: 'Skilled', className: 'tierSkilled' };
  if (avgRating >= 1200) return { tier: 'Advanced', className: 'tierAdvanced' };
  if (avgRating >= 1100) return { tier: 'Proficient', className: 'tierProficient' };
  if (avgRating >= 1000) return { tier: 'Intermediate', className: 'tierIntermediate' };
  if (avgRating >= 900) return { tier: 'Developing', className: 'tierDeveloping' };
  if (avgRating >= 800) return { tier: 'Apprentice', className: 'tierApprentice' };
  if (avgRating >= 700) return { tier: 'Beginner', className: 'tierBeginner' };
  if (avgRating >= 600) return { tier: 'Novice', className: 'tierNovice' };
  return { tier: 'Noob', className: 'tierNoob' };
};

// --- THIS FUNCTION RUNS ON THE SERVER AT BUILD TIME ---
export async function getStaticProps() {
  console.log('Running getStaticProps: Pre-calculating all data for the home page...');
  const publicDirectory = path.join(process.cwd(), 'public');
  const leaderboardData = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'final_leaderboard.json'), 'utf8'));
  const historyDataAll = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'rating_history_full.json'), 'utf8'));

  // --- 1. PRE-CALCULATE PEAK RATINGS ---
  const peakRatings = new Map();
  for (const entry of historyDataAll) {
    const rating = parseFloat(entry.rating_after);
    if (isNaN(rating)) continue;
    const currentPeak = peakRatings.get(entry.player_name) || 0;
    if (rating > currentPeak) {
      peakRatings.set(entry.player_name, rating);
    }
  }
  const initialPlayers = leaderboardData.map(player => ({
    ...player,
    peakRating: peakRatings.get(player.Player_Name) || player.Rating,
  }));

  // --- 2. PRE-CALCULATE EVENT DIFFICULTIES ---
  const eventDifficultyMap = new Map();
  for (const entry of historyDataAll) {
    if (!entry.event_name || entry.event_name === "Rating Decay") continue;
    if (!eventDifficultyMap.has(entry.event_name)) {
      eventDifficultyMap.set(entry.event_name, { totalRating: 0, playerCount: 0 });
    }
    const eventData = eventDifficultyMap.get(entry.event_name);
    const rating = parseFloat(entry.rating_after);
    if (!isNaN(rating)) {
      eventData.totalRating += rating;
      eventData.playerCount += 1;
    }
  }
  for (const [eventName, data] of eventDifficultyMap.entries()) {
    const avgRating = data.playerCount > 0 ? data.totalRating / data.playerCount : 0;
    data.averageRating = avgRating;
    const difficulty = getDifficultyTier(avgRating);
    data.difficultyTier = difficulty.tier;
    data.difficultyClassName = difficulty.className;
  }
  const uniqueNames = [...new Set(historyDataAll.map(e => e.event_name))];
  const initialEvents = uniqueNames
    .filter(name => name && name !== "Rating Decay")
    .map(name => {
      const eventData = eventDifficultyMap.get(name);
      return {
        name,
        cleanedName: stripDateFromEventName(name),
        date: extractDateFromEventName(name),
        difficulty: {
            tier: eventData?.difficultyTier || 'Unknown',
            className: eventData?.difficultyClassName || 'tierUnknown'
        },
        averageRating: eventData?.averageRating || 0,
        sortableDate: extractDateFromEventName(name) ? new Date(extractDateFromEventName(name)).toISOString() : null,
      };
    });

  return {
    props: {
      initialPlayers,
      initialEvents,
    },
    revalidate: 3600,
  };
}

const ITEMS_PER_PAGE = 100;

export default function Home({ initialPlayers, initialEvents }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('players');
  const [playerData, setPlayerData] = useState(initialPlayers);
  const [eventData, setEventData] = useState(initialEvents);
  const [playerSort, setPlayerSort] = useState('current');
  const [eventSort, setEventSort] = useState('newest');
  const [playerSortDirection, setPlayerSortDirection] = useState('desc');
  const [eventSortDirection, setEventSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, playerSort, playerSortDirection]);

  const handlePlayerSortChange = (newSortType) => {
    if (playerSort === newSortType) {
      setPlayerSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setPlayerSort(newSortType);
      setPlayerSortDirection('desc');
    }
  };

  const handleEventSortChange = (newSortType) => {
    if (eventSort === newSortType) {
      setEventSortDirection(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setEventSort(newSortType);
      setEventSortDirection('desc');
    }
  };

  const filteredPlayers = useMemo(() => {
    if (!playerData) return [];
    const sortMultiplier = playerSortDirection === 'desc' ? 1 : -1;
    const sortedPlayers = [...playerData].sort((a, b) => {
      if (playerSort === 'peak') {
        return (b.peakRating - a.peakRating) * sortMultiplier;
      }
      return (b.Rating - a.Rating) * sortMultiplier;
    });
    return sortedPlayers.filter(player =>
      player.Player_Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [playerData, searchQuery, playerSort, playerSortDirection]);

  const sortedEvents = useMemo(() => {
    if (!eventData) return [];
    const sortMultiplier = eventSortDirection === 'desc' ? 1 : -1;
    return [...eventData].sort((a, b) => {
      if (eventSort === 'difficulty') {
        return ((b.averageRating || 0) - (a.averageRating || 0)) * sortMultiplier;
      }
      const dateA = a.sortableDate ? new Date(a.sortableDate) : null;
      const dateB = b.sortableDate ? new Date(b.sortableDate) : null;
      if (dateA && dateB) {
        return (dateB - dateA) * sortMultiplier;
      }
      if (dateB) return 1;
      if (dateA) return -1;
      return b.name.localeCompare(a.name) * sortMultiplier;
    });
  }, [eventData, eventSort, eventSortDirection]);

  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlayers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPlayers, currentPage]);

  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);
  const filteredEvents = useMemo(() => {
    // It should filter from 'sortedEvents', not a non-existent variable.
    return sortedEvents.filter(event =>
      event.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedEvents, searchQuery]);

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
              <button className={`${styles.sortButton} ${playerSort === 'current' ? styles.sortButtonActive : ''}`} onClick={() => handlePlayerSortChange('current')}>
                Current Rating
                {playerSort === 'current' && <span className={styles.sortArrow}>{playerSortDirection === 'desc' ? '↓' : '↑'}</span>}
              </button>
              <button className={`${styles.sortButton} ${playerSort === 'peak' ? styles.sortButtonActive : ''}`} onClick={() => handlePlayerSortChange('peak')}>
                Peak Rating
                {playerSort === 'peak' && <span className={styles.sortArrow}>{playerSortDirection === 'desc' ? '↓' : '↑'}</span>}
              </button>
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
                  {paginatedPlayers.map((player, index) => {
                    const rank = (currentPage - 1) * ITEMS_PER_PAGE + index + 1;
                    return (
                      <tr key={player.Player_Name}>
                        <td>{rank}</td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className={styles.paginationControls}>
                <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className={styles.paginationButton}>
                  &larr; Previous
                </button>
                <span className={styles.paginationInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className={styles.paginationButton}>
                  Next &rarr;
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.sortToggle}>
              <span>Sort by:</span>
              <button className={`${styles.sortButton} ${eventSort === 'newest' ? styles.sortButtonActive : ''}`} onClick={() => handleEventSortChange('newest')}>
                Newest
                {eventSort === 'newest' && <span className={styles.sortArrow}>{eventSortDirection === 'desc' ? '↓' : '↑'}</span>}
              </button>
              <button className={`${styles.sortButton} ${eventSort === 'difficulty' ? styles.sortButtonActive : ''}`} onClick={() => handleEventSortChange('difficulty')}>
                Highest Difficulty
                {eventSort === 'difficulty' && <span className={styles.sortArrow}>{eventSortDirection === 'desc' ? '↓' : '↑'}</span>}
              </button>
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
                            <span className={`${styles.difficultyTag} ${styles[event.difficulty.className]}`}>
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
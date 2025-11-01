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

// --- THIS FUNCTION RUNS ON THE SERVER AT BUILD TIME ---
// It pre-fetches data, allowing the page to be pre-rendered as static HTML.
export async function getStaticProps() {
  const publicDirectory = path.join(process.cwd(), 'public');
  
  const leaderboardContent = fs.readFileSync(path.join(publicDirectory, 'final_leaderboard.json'), 'utf8');
  const historyContent = fs.readFileSync(path.join(publicDirectory, 'rating_history_full.json'), 'utf8');

  const leaderboardData = JSON.parse(leaderboardContent);
  const historyDataAll = JSON.parse(historyContent);

  return {
    props: {
      initialLeaderboardData: leaderboardData,
      initialHistoryDataAll: historyDataAll,
    },
    // Re-build the page at most once per hour to keep data fresh.
    revalidate: 3600, 
  };
}

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

const ITEMS_PER_PAGE = 100;

export default function Home({ initialLeaderboardData, initialHistoryDataAll }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState('players');
  
  // Initialize state with the pre-fetched data from getStaticProps.
  const [leaderboardData, setLeaderboardData] = useState(initialLeaderboardData);
  const [historyDataAll, setHistoryDataAll] = useState(initialHistoryDataAll);
  
  // The page is not in a loading state on initial load.
  const [loading, setLoading] = useState(false);

  const [playerSort, setPlayerSort] = useState('current');
  const [eventSort, setEventSort] = useState('newest');
  const [playerSortDirection, setPlayerSortDirection] = useState('desc');
  const [eventSortDirection, setEventSortDirection] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever the user changes search or sort filters.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, playerSort, playerSortDirection]);

  // Handlers for toggling sort type and direction.
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

  const playerDataWithPeak = useMemo(() => {
    if (!leaderboardData || leaderboardData.length === 0 || historyDataAll.length === 0) return [];
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

  const eventDifficultyMap = useMemo(() => { /* ... unchanged ... */ }, [historyDataAll]);
  const uniqueEvents = useMemo(() => { /* ... unchanged ... */ }, [historyDataAll, eventDifficultyMap, eventSort, eventSortDirection]);

  const filteredPlayers = useMemo(() => {
    if (!playerDataWithPeak || playerDataWithPeak.length === 0) return [];
    const sortMultiplier = playerSortDirection === 'desc' ? 1 : -1;
    const sortedPlayers = [...playerDataWithPeak].sort((a, b) => {
      if (playerSort === 'peak') {
        return (b.peakRating - a.peakRating) * sortMultiplier;
      }
      return (b.Rating - a.Rating) * sortMultiplier;
    });
    return sortedPlayers.filter(player =>
      player.Player_Name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [playerDataWithPeak, searchQuery, playerSort, playerSortDirection]);
  
  const paginatedPlayers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredPlayers.slice(startIndex, endIndex);
  }, [filteredPlayers, currentPage]);

  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);
  const filteredEvents = useMemo(() => { /* ... unchanged ... */ }, [uniqueEvents, searchQuery]);

  // This check is now mostly a fallback.
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
                            <UnoptimizedAvatar
                              playerName={player.Player_Name}
                              alt={`${player.Player_Name}'s skin`}
                              width={32}
                              height={32}
                              className={styles.playerAvatar}
                              // Prioritize the first 5 images on the first page for LCP.
                              priority={index < 5 && currentPage === 1}
                            />
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
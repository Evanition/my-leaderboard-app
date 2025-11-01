// pages/player/[name].js

import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';
import styles from '../../styles/PlayerProfile.module.css';
import { slugify } from '../../utils/slugify';
import { stripDateFromEventName } from '../../utils/formatters';
import UnoptimizedAvatar from '../../components/UnoptimizedAvatar';
import EventLogo from '../../components/EventLogo';
import PlayerChart from '../../components/PlayerChart'; // Assuming your chart is in this component
import { loadData } from '../../lib/data'; // <-- Import the new loader

// --- THIS FUNCTION RUNS AT BUILD TIME ON THE SERVER ---
// It tells Next.js which player pages to generate.
export async function getStaticPaths() {
  const fs = require('fs');
  const path = require('path');

  const publicDirectory = path.join(process.cwd(), 'public');
  const leaderboardData = JSON.parse(fs.readFileSync(path.join(publicDirectory, 'final_leaderboard.json'), 'utf8'));

  const paths = leaderboardData.map((player) => ({
    params: { name: encodeURIComponent(player.Player_Name) },
  }));

  // fallback: false means any path not generated at build time will result in a 404.
  return { paths, fallback: false };
}

// --- THIS FUNCTION RUNS AT BUILD TIME FOR EACH PLAYER ---
// It fetches and processes the data for a single player page.
export async function getStaticProps({ params }) {
  const name = decodeURIComponent(params.name);
  
  // --- MODIFICATION: Use the cached loader ---
  const { leaderboardData, historyDataAll } = loadData();

  const playerSummary = leaderboardData.find(player => player.Player_Name === name);
  const playerHistoryChronological = historyDataAll
    .filter(entry => entry.player_name === name)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  let peakRating = 0;

  // Calculate chart data and peak rating
  const chartData = playerHistoryChronological.map((entry, index) => {
    const rating = parseFloat(entry.rating_after);
    if (rating > peakRating) {
      peakRating = rating;
    }
    const previousRating = index > 0 ? parseFloat(playerHistoryChronological[index - 1].rating_after) : 1000.00;
    const ratingChange = rating - previousRating;

    return {
      date: new Date(entry.event_date).toISOString(),
      rating: rating,
      event: entry.event_name,
      change: ratingChange.toFixed(2),
      rank: entry.rank_at_event || null,
    };
  });
  
  // Create a reversed version for the UI list (newest first)
  const eventHistoryForList = [...playerHistoryChronological].reverse();

  return {
    props: {
      playerName: name,
      playerSummary,
      eventHistory: eventHistoryForList,
      chartData,
      peakRating: peakRating.toFixed(2),
    },
    revalidate: 3600, // Re-generate the page at most once per hour
  };
}

// The component now receives all its data as props and has no client-side fetching.
export default function PlayerProfile({ playerName, playerSummary, eventHistory, chartData, peakRating }) {
  // This memo hook still runs on the client to format the date object for the chart library.
  const processedChartData = useMemo(() => {
    return chartData.map(entry => ({
      ...entry,
      date: new Date(entry.date),
    }));
  }, [chartData]);

  const participatedEvents = eventHistory.filter(event => event.rank_at_event);

  const getRankClassName = (rank) => {
    if (rank === 1) return styles.rankGold;
    if (rank === 2) return styles.rankSilver;
    if (rank === 3) return styles.rankBronze;
    return '';
  };

  if (!playerSummary) {
    return <p>Player not found.</p>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{playerName}'s Profile</title>
      </Head>
      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
          &larr; Back to Leaderboard
        </Link>
        <header className={styles.profileHeader}>
          <div className={styles.profileTitle}>
            <UnoptimizedAvatar playerName={playerName} alt={`${playerName}'s skin`} width={80} height={80} className={styles.profileAvatar} />
            <h1 className={styles.playerName}>{playerName}</h1>
          </div>
          <div className={styles.statsContainer}>
            <div className={styles.statCard}>
              <p className={styles.statValue}>{playerSummary.Rating.toFixed(2)}</p>
              <p className={styles.statLabel}>Current Rating</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statValue}>{peakRating}</p>
              <p className={styles.statLabel}>Peak Rating</p>
            </div>
            <div className={styles.statCard}>
              <p className={styles.statValue}>#{playerSummary.Rank}</p>
              <p className={styles.statLabel}>Overall Rank</p>
            </div>
          </div>
        </header>
        <div className={styles.gridContainer}>
          <div className={styles.dataCard}>
            <h2 className={styles.sectionTitle}>Rating Progression</h2>
            <div className={styles.chartWrapper}>
              <PlayerChart chartData={processedChartData} />
            </div>
          </div>
          <div className={styles.dataCard}>
            <h2 className={styles.sectionTitle}>Event History</h2>
            <div className={styles.matchHistoryContainer}>
              {participatedEvents.length > 0 ? (
                <ul className={styles.eventList}>
                  {participatedEvents.map((event, index) => (
                    <li key={index} className={styles.eventItem}>
                      <Link href={`/event/${slugify(event.event_name)}`} className={styles.eventLink}>
                        <div className={styles.eventNameWrapper}>
                          <EventLogo eventName={event.event_name} size={24} />
                          <span className={styles.eventName}>{stripDateFromEventName(event.event_name)}</span>
                        </div>
                        <span className={`${styles.eventRank} ${getRankClassName(event.rank_at_event)}`}>
                          #{event.rank_at_event}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.emptyHistoryMessage}>No events played yet.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
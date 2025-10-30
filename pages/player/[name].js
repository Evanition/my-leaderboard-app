// pages/player/[name].js

"use client";

import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic'; // Import dynamic

import styles from '../../styles/PlayerProfile.module.css';
import historyDataAll from '../../public/rating_history_full.json';
import leaderboardData from '../../public/final_leaderboard.json';
import { slugify } from '../../utils/slugify';
import EventLogo from '../../components/EventLogo';
import UnoptimizedAvatar from '../../components/UnoptimizedAvatar';
import { stripDateFromEventName } from '../../utils/formatters';

// --- DYNAMICALLY IMPORT THE CHART COMPONENT ---
// This tells Next.js to load the PlayerChart component in a separate JavaScript file.
const PlayerChart = dynamic(() => import('../../components/PlayerChart'), {
  // This content will be shown while the chart component is loading.
  loading: () => <p style={{ textAlign: 'center', minHeight: '400px' }}>Loading chart...</p>,
  // This is crucial: it ensures the chart is only ever rendered on the client-side.
  ssr: false, 
});

export default function PlayerProfile() {
  const router = useRouter();
  const { name } = router.query;

  const [playerName, setPlayerName] = useState('');
  const [playerSummary, setPlayerSummary] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [peakRating, setPeakRating] = useState('0.00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const decodedName = decodeURIComponent(name);
    setPlayerName(decodedName);

    const playerHistoryRaw = Array.isArray(historyDataAll) ? historyDataAll : Object.values(historyDataAll);
    const playerHistoryChronological = playerHistoryRaw
      .filter(entry => entry.player_name === decodedName)
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

    const summary = leaderboardData.find(player => player.Player_Name === decodedName);
    setPlayerSummary(summary);

    if (playerHistoryChronological.length) {
      let peak = 0;
      const calculatedChartData = playerHistoryChronological.map((entry, index) => {
        const rating = parseFloat(entry.rating_after);
        if (rating > peak) peak = rating;
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
      
      setChartData(calculatedChartData);
      setPeakRating(peak.toFixed(2));
      setEventHistory([...playerHistoryChronological].reverse());
    }
    
    setLoading(false);
  }, [router.isReady, name]);

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

  if (loading) {
    return <p>Loading player data...</p>;
  }

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
            <UnoptimizedAvatar
              playerName={playerName}
              alt={`${playerName}'s skin`}
              width={80}  // A larger size for the header
              height={80}
              className={styles.profileAvatar}
            />
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
              {/* --- THIS IS THE ONLY CHANGE IN THE JSX --- */}
              {/* Instead of the big block of chart JSX, we just call our new component */}
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
                          <span className={styles.eventName}>
                            {stripDateFromEventName(event.event_name)} {/* <-- USE IT HERE */}
                          </span>
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
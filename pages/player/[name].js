import Head from 'next/head';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from 'recharts';
import styles from '../../styles/PlayerProfile.module.css';
import CustomTooltip from '../../components/CustomTooltip';
import historyDataAll from '../../data/rating_history_full.json';
import leaderboardData from '../../data/final_leaderboard.json';
import { slugify } from '../../utils/slugify';

// --- This tells Next.js which player pages to build ---
export async function getStaticPaths() {
  const playersArray = Array.isArray(leaderboardData) ? leaderboardData : Object.values(leaderboardData);
  const paths = playersArray.map((player) => ({
    params: { name: encodeURIComponent(player.Player_Name) },
  }));
  return { paths, fallback: false };
}

// --- This fetches the data for a single player page ---
export async function getStaticProps({ params }) {
  const name = decodeURIComponent(params.name);
  const playerHistoryRaw = Array.isArray(historyDataAll) ? historyDataAll : Object.values(historyDataAll);
  
  // Get all history for the player, sorted chronologically (oldest to newest) for calculations.
  const playerHistoryChronological = playerHistoryRaw
    .filter(entry => entry.player_name === name)
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const playerSummary = leaderboardData.find(player => player.Player_Name === name);

  if (!playerHistoryChronological.length) {
    return { notFound: true };
  }

  let peakRating = 0;

  // Calculate chartData based on the correct chronological order.
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
  
  // Create a reversed version of the history for the UI list (newest first).
  const eventHistoryForList = [...playerHistoryChronological].reverse();

  return {
    props: {
      playerName: name,
      playerSummary,
      eventHistory: eventHistoryForList,
      chartData,
      peakRating: peakRating.toFixed(2),
    },
  };
}

// --- The Player Profile Component ---
export default function PlayerProfile({ playerName, playerSummary, eventHistory, chartData, peakRating }) {
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
          <h1 className={styles.playerName}>{playerName}</h1>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={processedChartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                  <defs>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#8a78f0" />
                      <stop offset="100%" stopColor="#f871ab" />
                    </linearGradient>
                    <linearGradient id="brushGradient" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#8a78f0" stopOpacity={0.8}/>
                       <stop offset="95%" stopColor="#f871ab" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
                  <XAxis dataKey="date" hide={true} />
                  <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="rgba(128, 128, 128, 0.5)" />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(128, 128, 128, 0.5)', strokeWidth: 1, strokeDasharray: '3 3' }} />
                  <Line type="monotone" dataKey="rating" stroke="url(#lineGradient)" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />
                  <Brush 
                    dataKey="date" 
                    height={40} 
                    stroke="rgba(138, 120, 240, 0.5)" 
                    y={350}
                    fill="url(#brushGradient)"
                    tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
                  >
                    <LineChart>
                      <Line type="monotone" dataKey="rating" stroke="url(#lineGradient)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </Brush>
                </LineChart>
              </ResponsiveContainer>
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
                        <span className={styles.eventName}>{event.event_name}</span>
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
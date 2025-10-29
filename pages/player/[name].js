import Head from 'next/head';
import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // <-- CORRECT IMPORT FOR PAGES ROUTER
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from 'recharts';
import styles from '../../styles/PlayerProfile.module.css';
import CustomTooltip from '../../components/CustomTooltip';
import historyDataAll from '../../public/rating_history_full.json';
import leaderboardData from '../../public/final_leaderboard.json';
import { slugify } from '../../utils/slugify';

// --- The Player Profile Component (Client-Side) ---
export default function PlayerProfile() {
  const router = useRouter();
  // We get 'name' from router.query, but it might not be ready on first render.
  const { name } = router.query; 

  const [playerName, setPlayerName] = useState('');
  const [playerSummary, setPlayerSummary] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [peakRating, setPeakRating] = useState('0.00');
  const [loading, setLoading] = useState(true); // Start in a loading state

  useEffect(() => {
    // Only run the data fetching logic when the router is ready and 'name' is available.
    if (!router.isReady) {
      return; 
    }

    const decodedName = decodeURIComponent(name);
    setPlayerName(decodedName);

    // --- All the data processing logic is moved inside useEffect ---
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
        if (rating > peak) {
          peak = rating;
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
      
      setChartData(calculatedChartData);
      setPeakRating(peak.toFixed(2));
      setEventHistory([...playerHistoryChronological].reverse());
    }
    
    setLoading(false); // Data is processed, stop loading

  }, [router.isReady, name]); // Dependency array ensures this runs when the router is ready

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

  // --- Render Loading and Not Found States ---
  if (loading) {
    return <p>Loading player data...</p>;
  }

  if (!playerSummary) {
    return <p>Player not found.</p>;
  }

  // --- Render the main component JSX ---
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
// pages/event/[eventSlug].js

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../styles/EventPage.module.css';
import { slugify } from '../../utils/slugify';
import { loadData } from '../../lib/data'; // <-- Import the new loader
import { stripDateFromEventName } from '../../utils/formatters';
import EventLogo from '../../components/EventLogo';
import UnoptimizedAvatar from '../../components/UnoptimizedAvatar';

// --- THIS FUNCTION RUNS AT BUILD TIME ON THE SERVER ---
// It tells Next.js which event pages to generate.
export async function getStaticPaths() {
  // --- MODIFICATION: Use the cached loader ---
  const { historyDataAll } = loadData();
  const allEventNames = historyDataAll.map(entry => entry.event_name);
  const uniqueEventNames = [...new Set(allEventNames)].filter(name => name && name !== "Rating Decay");
  const paths = uniqueEventNames.map(name => ({
    params: { eventSlug: slugify(name) },
  }));
  return { paths, fallback: false };
}


// --- THIS FUNCTION RUNS AT BUILD TIME FOR EACH EVENT ---
// It fetches and processes the data for a single event page.
export async function getStaticProps({ params }) {
  const { eventSlug } = params;
  
  // --- MODIFICATION: Use the cached loader ---
  const { historyDataAll } = loadData();
  const fs = require('fs');

  const eventEntry = historyDataAll.find(entry => slugify(entry.event_name) === eventSlug);
  const originalEventName = eventEntry.event_name;

  const eventPlayers = historyDataAll
    .filter(entry => entry.event_name === originalEventName)
    .sort((a, b) => a.rank_at_event - b.rank_at_event);

  const totalRating = eventPlayers.reduce((sum, player) => {
    const rating = parseFloat(player.rating_after);
    return sum + (isNaN(rating) ? 0 : rating);
  }, 0);
  const averageRating = totalRating / eventPlayers.length;

  return {
    props: {
      eventName: originalEventName,
      eventPlayers,
      averageRating: averageRating.toFixed(2),
    },
    revalidate: 3600,
  };
}
// The component now receives all its data as props.
export default function EventPage({ eventName, eventPlayers, averageRating }) {
  const eventDate = eventPlayers.length > 0
    ? new Date(eventPlayers[0].event_date).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    : '';

  return (
    <div className={styles.container}>
      <Head>
        <title>Results for {stripDateFromEventName(eventName)}</title>
      </Head>
      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
          &larr; Back to Leaderboard
        </Link>
        <div className={styles.eventHeader}>
            <EventLogo eventName={eventName} size={64} />
            <div>
                <h1 className={styles.title}>{stripDateFromEventName(eventName)}</h1>
                <div className={styles.subtitleContainer}>
                    {eventDate && <p className={styles.subtitle}>{eventDate}</p>}
                    <p className={`${styles.subtitle} ${styles.averageEloSubtitle}`}>
                      • {averageRating} Avg ELO
                    </p>
                </div>
            </div>
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.eventTable}>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Rating After</th>
              </tr>
            </thead>
            <tbody>
              {eventPlayers.map((player) => (
                <tr key={player.player_name}>
                  <td>#{player.rank_at_event}</td>
                  <td>
                    <div className={styles.playerCell}>
                      <UnoptimizedAvatar
                        playerName={player.player_name}
                        alt={`${player.player_name}'s skin`}
                        width={32}
                        height={32}
                        className={styles.playerAvatar}
                      />
                      <Link href={`/player/${encodeURIComponent(player.player_name)}`} prefetch={false}>
                        {player.player_name}
                      </Link>
                    </div>
                  </td>
                  <td>{parseFloat(player.rating_after).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
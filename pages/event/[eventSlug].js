// pages/event/[eventSlug].js

"use client";

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import styles from '../../styles/EventPage.module.css';
import historyDataAll from '../../public/rating_history_full.json';
import { slugify } from '../../utils/slugify';
import { stripDateFromEventName } from '../../utils/formatters';
import EventLogo from '../../components/EventLogo';
import UnoptimizedAvatar from '../../components/UnoptimizedAvatar';

export default function EventPage() {
  const router = useRouter();
  const { eventSlug } = router.query;

  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;
    const eventEntry = historyDataAll.find(entry => slugify(entry.event_name) === eventSlug);
    if (eventEntry) {
      setEventName(eventEntry.event_name);
    }
    setLoading(false);
  }, [router.isReady, eventSlug]);

  const eventData = useMemo(() => {
    if (!eventName) return null;

    const players = historyDataAll
      .filter(entry => entry.event_name === eventName)
      .sort((a, b) => a.rank_at_event - b.rank_at_event);

    if (players.length === 0) {
      return { players, averageRating: 0 };
    }

    // --- THIS IS THE DEFINITIVE FIX ---
    // We now calculate the total ELO using 'rating_after'. This is the most
    // reliable number in the dataset and aligns with the homepage's difficulty metric.
    const totalRating = players.reduce((sum, player) => {
      // 1. Attempt to parse the rating_after value.
      const ratingAfter = parseFloat(player.rating_after);
  console.log(`Player: ${player.player_name}, rating_after:`, player.rating_after, `Type: ${typeof player.rating_after}`);
      // 2. A simple safety check ensures we only add valid numbers.
      if (!isNaN(ratingAfter)) {
        return sum + ratingAfter;
      }
      return sum; // If it's not a number, add nothing for this player.
    }, 0);

    const averageRating = totalRating / players.length;

    return { players, averageRating };
  }, [eventName]);

  if (loading) {
    return <p>Loading event data...</p>;
  }

  if (!eventData) {
    return <p>Event not found.</p>;
  }

  const eventDate = eventData.players.length > 0
    ? new Date(eventData.players[0].event_date).toLocaleDateString(undefined, {
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
                    {/* This will now display the correct, calculated average */}
                    <p className={`${styles.subtitle} ${styles.averageEloSubtitle}`}>
                      • {eventData.averageRating.toFixed(2)} Avg ELO
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
              {eventData.players.map((player) => (
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
                      <Link href={`/player/${encodeURIComponent(player.player_name)}`}>
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
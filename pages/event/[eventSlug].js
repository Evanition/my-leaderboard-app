"use client";

import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router'; // Use 'next/router' for the Pages Router
import styles from '../../styles/EventPage.module.css';
import historyDataAll from '../../public/rating_history_full.json';
import { slugify } from '../../utils/slugify';
import EventLogo from '../../components/EventLogo'; // <-- Import the new component
import UnoptimizedAvatar from '../components/UnoptimizedAvatar';

// The Event Page Component (Client-Side)
export default function EventPage() {
  const router = useRouter();
  const { eventSlug } = router.query; // Get the slug from the URL

  // State to hold event data, initialized to empty/loading states
  const [eventName, setEventName] = useState('');
  const [eventPlayers, setEventPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We only run the logic if the router is ready and the eventSlug exists
    if (!router.isReady) {
      return;
    }

    // Find the original event name by matching its slugified version
    const eventEntry = historyDataAll.find(entry => slugify(entry.event_name) === eventSlug);

    // If an event is found, process its data
    if (eventEntry) {
      const originalEventName = eventEntry.event_name;
      setEventName(originalEventName);

      // Filter the history to get all players from this event and sort them
      const eventData = historyDataAll
        .filter(entry => entry.event_name === originalEventName)
        .sort((a, b) => a.rank_at_event - b.rank_at_event);
      
      setEventPlayers(eventData);
    }

    // Set loading to false once data processing is complete
    setLoading(false);

  }, [router.isReady, eventSlug]); // Rerun this effect when the router is ready or the slug changes

  // Display a loading message while data is being prepared
  if (loading) {
    return <p>Loading event data...</p>;
  }

  // Display a not found message if no event name was set after loading
  if (!eventName) {
    return <p>Event not found.</p>;
  }

  // Calculate the event date only when we have the data
  const eventDate = eventPlayers.length > 0 
    ? new Date(eventPlayers[0].event_date).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric'
      }) 
    : '';

  return (
    <div className={styles.container}>
      <Head>
        <title>Results for {eventName}</title>
      </Head>

      <main className={styles.main}>
        {/* --- MODIFICATION START --- */}
        <div className={styles.eventHeader}>
          <EventLogo eventName={eventName} size={64} />
          <div>
            <h1 className={styles.title}>{eventName}</h1>
            {eventDate && <p className={styles.subtitle}>{eventDate}</p>}
          </div>
        </div>
        {/* --- MODIFICATION END --- */}
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
                        playerName={player.player_name} // <-- CHANGE THIS
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
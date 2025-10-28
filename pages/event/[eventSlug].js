import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../../styles/EventPage.module.css';
import historyDataAll from '../../data/rating_history_full.json';
import { slugify } from '../../utils/slugify'; // MODIFICATION: Import the slugify function

// This tells Next.js which event pages to build using slugs
export async function getStaticPaths() {
  const allEventNames = historyDataAll.map(entry => entry.event_name);
  const uniqueEventNames = [...new Set(allEventNames)].filter(name => name !== "Rating Decay");

  // MODIFICATION: Create paths using the slugified name
  const paths = uniqueEventNames.map(name => ({
    params: { eventSlug: slugify(name) },
  }));

  return { paths, fallback: false };
}

// This fetches the data for a single event page by its slug
export async function getStaticProps({ params }) {
  const { eventSlug } = params;

  // MODIFICATION: Find the original event name by matching its slug
  const eventEntry = historyDataAll.find(entry => slugify(entry.event_name) === eventSlug);

  if (!eventEntry) {
    return { notFound: true };
  }
  
  const originalEventName = eventEntry.event_name;

  // Filter the history to get all players from this event
  const eventData = historyDataAll
    .filter(entry => entry.event_name === originalEventName)
    .sort((a, b) => a.rank_at_event - b.rank_at_event);

  return {
    props: {
      eventName: originalEventName,
      eventPlayers: eventData,
    },
  };
}

// The Event Page Component (no major changes here)
export default function EventPage({ eventName, eventPlayers }) {
  const eventDate = new Date(eventPlayers[0].event_date).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className={styles.container}>
      <Head>
        <title>Results for {eventName}</title>
      </Head>

      <main className={styles.main}>
        <Link href="/" className={styles.backLink}>
          &larr; Back to Leaderboard
        </Link>
        <h1 className={styles.title}>{eventName}</h1>
        <p className={styles.subtitle}>{eventDate}</p>
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
                      <Image
                        src={`https://cravatar.eu/avatar/${player.player_name}/32`}
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
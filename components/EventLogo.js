// components/EventLogo.js

import Image from 'next/image';
// --- THIS IS THE KEY FIX ---
// This component runs on the client, so it can't use the server-only `lib/data.js`.
// We need to re-create the function here or move it to a shared file.
// For simplicity and since it's only used here on the client, let's define it locally.

/**
 * Finds the correct logo path for a given event name.
 * @param {string} eventName - The full name of the event.
 * @returns {string} The path to the correct logo image.
 */
function getLogoForEvent(eventName) {
  if (!eventName) return '/logos/default-event.png';
  const name = eventName.toLowerCase();
  if (name.includes('twitch rivals')) return '/logos/twitch-rivals.png';
  if (name.includes('block wars')) return '/logos/block-wars.png';
  if (name.includes('minecraft championship')) return '/logos/minecraft-championship.png';
  return '/logos/default-event.png';
}

import styles from './EventLogo.module.css';

const EventLogo = ({ eventName, size = 32 }) => {
  const logoSrc = getLogoForEvent(eventName);

  return (
    <div className={styles.logoWrapper} style={{ width: size, height: size }}>
      <Image
        src={logoSrc}
        alt={`${eventName} logo`}
        width={size}
        height={size}
        className={styles.eventLogo}
        onError={(e) => { e.currentTarget.src = '/logos/default-event.png'; }}
      />
    </div>
  );
};

export default EventLogo;
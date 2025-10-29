// components/EventLogo.js

import Image from 'next/image';
// Import the new function instead of the old map
import { getLogoForEvent } from '../data/logoMatcher'; 
import styles from './EventLogo.module.css';

/**
 * A reusable component that displays the correct logo for any given event name.
 */
const EventLogo = ({ eventName, size = 32 }) => {
  // The core logic is now simpler: just call the function to get the logo source.
  const logoSrc = getLogoForEvent(eventName);

  return (
    <div className={styles.logoWrapper} style={{ width: size, height: size }}>
      <Image
        src={logoSrc}
        alt={`${eventName} logo`}
        width={size}
        height={size}
        className={styles.eventLogo}
        // This is a safety net. If a logo file is missing but a rule for it
        // exists, this will prevent a broken image icon from showing.
        onError={(e) => {
          e.currentTarget.src = '/logos/default-event.png';
        }}
      />
    </div>
  );
};

export default EventLogo;
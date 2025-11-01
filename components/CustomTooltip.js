import React from 'react';
import styles from '../styles/PlayerProfile.module.css';

// --- Icon Components ---
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className={styles.tooltipIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className={styles.tooltipIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 00-7-7m0 0a7 7 0 00-7 7m7-7v4m0 0H9m4 0h4" />
  </svg>
);

// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const rating = parseFloat(data.rating).toFixed(0);
    const eventName = data.event;
    const change = parseFloat(data.change);
    const rank = data.rank; // Get rank from data
    const isPositive = change >= 0;

    const changeColor = isPositive ? '#10b981' : '#f43f5e';
    const changeText = isPositive ? `+${change.toFixed(0)}` : change.toFixed(0);

    return (
      <div className={styles.customTooltip}>
        <div className={styles.tooltipHeader}>
          <CalendarIcon />
          <span className={styles.tooltipEventName}>{eventName}</span>
        </div>

        {/* MODIFICATION: Conditionally render the Rank row only if rank exists */}
        {rank && (
          <div className={styles.tooltipRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <TrophyIcon />
              <span className={styles.tooltipLabel}>Rank</span>
            </div>
            <span className={styles.tooltipValue}>#{rank}</span>
          </div>
        )}
        
        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>Rating After</span>
          <span className={styles.tooltipValue}>{rating}</span>
        </div>

        <div className={styles.tooltipRow}>
          <span className={styles.tooltipLabel}>Change</span>
          <span className={styles.tooltipValue} style={{ color: changeColor }}>
            {changeText}
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default CustomTooltip;
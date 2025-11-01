import React from 'react';
import styles from '../styles/PlayerProfile.module.css'; // Use profile styles for consistency

export default function MatchHistoryTable({ matches }) {
    if (!matches || matches.length === 0) {
        return <p>No match history available.</p>;
    }

    return (
        <table className={styles.matchTable}>
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Result</th>
                    <th>ELO Change</th>
                </tr>
            </thead>
            <tbody>
                {matches.map((match, index) => {
                    const isWin = match.result === 'WON';
                    const change = parseFloat(match.rating_change);
                    const changeText = change >= 0 ? `+${change.toFixed(0)}` : change.toFixed(0);
                    const resultStyle = { color: isWin ? 'green' : 'red', fontWeight: 'bold' };

                    return (
                        <tr key={index}>
                            <td>{match.match_date}</td>
                            <td>{match.event_name}</td>
                            <td style={resultStyle}>{match.result}</td>
                            <td style={resultStyle}>{changeText}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
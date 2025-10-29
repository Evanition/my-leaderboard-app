// components/PlayerChart.js

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush
} from 'recharts';
import CustomTooltip from './CustomTooltip'; // Make sure the path is correct

/**
 * A client-side only component that renders the player's rating progression chart.
 * It's loaded dynamically to reduce the initial JavaScript bundle size of the player page.
 * @param {object} props - The component props.
 * @param {Array} props.chartData - The data array for the chart.
 */
const PlayerChart = ({ chartData }) => {
  return (
    // The ResponsiveContainer makes the chart fill its parent div.
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
        {/* Gradients for the line and brush visuals */}
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

        {/* Chart components */}
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.2)" />
        <XAxis dataKey="date" hide={true} />
        <YAxis domain={['dataMin - 100', 'dataMax + 100']} stroke="rgba(128, 128, 128, 0.5)" />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(128, 128, 128, 0.5)', strokeWidth: 1, strokeDasharray: '3 3' }} />
        <Line type="monotone" dataKey="rating" stroke="url(#lineGradient)" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 2 }} />

        {/* The brush/slider at the bottom of the chart */}
        <Brush 
          dataKey="date" 
          height={40} 
          stroke="rgba(138, 120, 240, 0.5)" 
          y={350} // Adjust this value if the brush overlaps strangely
          fill="url(#brushGradient)"
          tickFormatter={(tick) => new Date(tick).toLocaleDateString()}
        >
          {/* This nested chart provides the mini-preview inside the brush */}
          <LineChart>
            <Line type="monotone" dataKey="rating" stroke="url(#lineGradient)" strokeWidth={2} dot={false} />
          </LineChart>
        </Brush>
      </LineChart>
    </ResponsiveContainer>
  );
};

export default PlayerChart;
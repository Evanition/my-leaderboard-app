// pages/_app.js

import '../styles/globals.css';
import { Inter } from 'next/font/google'; // Or any other font from next/font

// Configure the font object
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // This is important for performance
  variable: '--font-inter', // This will be the CSS variable name
});

function MyApp({ Component, pageProps }) {
  // Apply the font's CSS variable to the entire application
  // by wrapping everything in a main tag with the className.
  return (
    <main className={inter.variable}>
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp;
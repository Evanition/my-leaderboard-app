// pages/_app.js

import '../styles/globals.css';
import { Inter } from 'next/font/google'; // 1. Import the font module

// 2. Configure the font.
//    'subsets' reduces the font file size to only include necessary characters.
//    'variable' tells the module to create a CSS variable we can use.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Ensures text is visible while the font loads
  variable: '--font-inter', // This will be our new CSS variable
});

function MyApp({ Component, pageProps }) {
  // 3. Apply the font variable to the entire application.
  //    The `inter.variable` class makes the CSS variable available globally.
  return (
    <main className={inter.variable}>
      <Component {...pageProps} />
    </main>
  );
}

export default MyApp;
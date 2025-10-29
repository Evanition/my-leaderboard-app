// pages/_app.js

// This line imports the global CSS file we will create next.
// It ensures these styles are applied to every page of your site.
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  // This renders the current page.
  return <Component {...pageProps} />;
}

export default MyApp;
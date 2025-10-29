// image-loader.js

/**
 * This is a custom image loader for Next.js.
 * Its purpose is to bypass the default optimization and simply return
 * the original image source URL.
 *
 * @param {object} props - The properties for the image.
 * @param {string} props.src - The original source URL of the image (e.g., '/logos/block-wars.png').
 * @returns {string} The same source URL, unoptimized.
 */
export default function customImageLoader({ src }) {
  // This loader does nothing but return the original src.
  // This is how we achieve global unoptimization.
  return src;
}
export function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')       // Replace spaces with -
    .replace(/\//g, '-')       // Replace / with - (The most important part!)
    .replace(/[^\w\-]+/g, '')   // Remove all non-word chars except hyphens
    .replace(/\-\-+/g, '-')     // Replace multiple - with single -
    .replace(/^-+/, '')         // Trim - from start of text
    .replace(/-+$/, '');        // Trim - from end of text
}
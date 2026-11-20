const productionOrigin = 'https://jituptn.com';
const development = process.env.NODE_ENV === 'development';

function resolveMainOrigin() {
  for (const candidate of [process.env.NEXT_PUBLIC_JITU_MAIN_URL, process.env.NEXT_PUBLIC_MAIN_APP_URL]) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
      if (!development && /^(?:localhost\.?|.*\.localhost\.?|127\..*|0\.0\.0\.0|\[::1\])$/i.test(url.hostname)) continue;
      return url.origin;
    } catch {
      // Try the next configured origin.
    }
  }
  return development ? 'http://localhost:5173' : productionOrigin;
}

export const JITU_MAIN_URL = resolveMainOrigin();

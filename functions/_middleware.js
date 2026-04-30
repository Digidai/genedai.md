// AI training/inference crawlers only — NOT search engine crawlers
// Googlebot, Bingbot, Yandex, etc. must get HTML for proper indexing
const AI_BOT_PATTERNS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  'PerplexityBot',
  'CCBot',
  'cohere-ai',
  'Meta-ExternalAgent',
  'Meta-ExternalFetcher',
  'Amazonbot',
  'YouBot',
  'AI2Bot',
  'Diffbot',
];

// Mirrors /_headers. Cloudflare does NOT apply _headers to Responses
// constructed inside a Pages Function, so the bot/plain-text branch
// must attach them manually. Keep these two lists in sync.
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
};

function isAIBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return AI_BOT_PATTERNS.some(p => ua.includes(p.toLowerCase()));
}

function prefersPlainText(accept) {
  if (!accept) return false;
  return accept
    .split(',')
    .map(part => part.trim().split(';')[0].toLowerCase())
    .some(type => type === 'text/plain' || type === 'text/markdown');
}

export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);

  if (url.pathname !== '/' && url.pathname !== '/index.html') {
    return next();
  }

  const userAgent = request.headers.get('User-Agent') || '';
  const accept = request.headers.get('Accept') || '';

  if (isAIBot(userAgent) || prefersPlainText(accept)) {
    try {
      const llmsUrl = new URL('/llms.txt', request.url);
      const llmsResponse = await env.ASSETS.fetch(llmsUrl);

      if (llmsResponse.ok) {
        const content = await llmsResponse.text();
        return new Response(content, {
          status: 200,
          headers: {
            ...SECURITY_HEADERS,
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Content-Source': 'llms.txt',
            'X-Robots-Tag': 'all',
            'Cache-Control': 'public, max-age=86400',
            'Vary': 'User-Agent, Accept',
          },
        });
      }
    } catch (err) {
      console.warn('llms.txt content negotiation fell back to HTML:', err);
    }
  }

  const response = await next();
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Vary', 'User-Agent, Accept');
  return newResponse;
}

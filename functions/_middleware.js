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

function isAIBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return AI_BOT_PATTERNS.some(p => ua.includes(p.toLowerCase()));
}

function prefersPlainText(accept) {
  if (!accept) return false;
  if (accept.includes('text/markdown')) return true;
  if (accept === 'text/plain') return true;
  return false;
}

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // Only intercept root path
  if (url.pathname !== '/' && url.pathname !== '/index.html') {
    return next();
  }

  const userAgent = request.headers.get('User-Agent') || '';
  const accept = request.headers.get('Accept') || '';

  if (isAIBot(userAgent) || prefersPlainText(accept)) {
    try {
      const llmsUrl = new URL('/llms.txt', request.url);
      const llmsResponse = await fetch(llmsUrl);

      if (llmsResponse.ok) {
        const content = await llmsResponse.text();
        return new Response(content, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Content-Source': 'llms.txt',
            'X-Robots-Tag': 'all',
            'Cache-Control': 'public, max-age=3600',
            'Vary': 'User-Agent, Accept',
          },
        });
      }
    } catch {
      // Fallback to HTML if llms.txt fetch fails
    }
  }

  // Human visitors get the normal HTML page
  const response = await next();
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Vary', 'User-Agent, Accept');
  return newResponse;
}

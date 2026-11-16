// Runs first on every request (run_worker_first): http and www -> https apex 301, then the static asset,
// then the fallbacks below. Adds security headers to every response.
//   /dir/   serves /dir/index.html
//   /about  301 to /about.html (or /about/), keeping the query
//   else    404.html with status 404
const SECURITY = {
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'SAMEORIGIN',
};
function secure(res) {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY)) out.headers.set(k, v);
  return out;
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith('www.') || url.protocol === 'http:') {
      url.hostname = url.hostname.replace(/^www\./, '');
      url.protocol = 'https:';
      return Response.redirect(url.href, 301);
    }
    const asset = await env.ASSETS.fetch(request);
    if (asset.status !== 404) return secure(asset);
    return secure(await route(request, env));
  },
};
async function route(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '');
  const last = path.split('/').pop();
  if (url.pathname.endsWith('/')) {
    const index = await env.ASSETS.fetch(new Request(new URL(`${url.pathname}index.html`, url), request));
    if (index.ok) return index;
  }
  if (path && !last.includes('.')) {
    for (const target of [new URL(`${path}.html${url.search}`, url), new URL(`${path}/${url.search}`, url)]) {
      const probe = target.pathname.endsWith('/') ? `${target.pathname}index.html` : target.pathname;
      const hit = await env.ASSETS.fetch(new Request(new URL(probe, url), { method: 'HEAD' }));
      if (hit.ok) return Response.redirect(target.href, 301);
    }
  }
  const page = await env.ASSETS.fetch(new Request(new URL('/404.html', url)));
  if (page.ok) return new Response(page.body, { status: 404, headers: page.headers });
  return new Response('404 Not Found', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
}

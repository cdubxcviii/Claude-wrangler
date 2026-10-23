// Packs the `expo export -p web` output (dist/) into one self-contained HTML page,
// dist/wrangler.html, for the shareable browser preview. Every script is inlined
// because the preview host only serves the page itself.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = 'dist';
const index = readFileSync(join(dist, 'index.html'), 'utf8');
const scripts = [...index.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)].map((m) => m[1]);
if (!scripts.length) throw new Error('No scripts found in dist/index.html. Run `expo export -p web` first.');

const inline = scripts
  .map((src) => {
    const code = readFileSync(join(dist, src.replace(/^\//, '')), 'utf8')
      .replaceAll('</script', '<\\/script')
      .replaceAll('<!--', '<\\!--');
    return `<script>\n${code}\n</script>`;
  })
  .join('\n');

const page = `<title>Wrangler</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Grand+Hotel&display=swap">
<style>
  /* Full-screen app shell; the app draws its own light and dark palettes. */
  :root { --bg: #ffffff; --fg: #0f1419; }
  @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --bg: #000000; --fg: #f5f5f5; color-scheme: dark; } }
  :root[data-theme="dark"] { --bg: #000000; --fg: #f5f5f5; color-scheme: dark; }
  html { box-sizing: border-box; height: 100%; }
  body { height: 100%; overflow: hidden; background: var(--bg); color: var(--fg); }
  #root { display: flex; height: 100%; flex: 1; }
</style>
<div id="root"></div>
<script>
  // Navigation calls history.pushState; never let a refused history write stop the app.
  (function () {
    ['pushState', 'replaceState'].forEach(function (name) {
      var original = history[name];
      history[name] = function () {
        try { return original.apply(history, arguments); } catch (e) { console.warn('Wrangler: ' + name + ' blocked', e); }
      };
    });
  })();
</script>
${inline}
`;

writeFileSync(join(dist, 'wrangler.html'), page);
console.log(`Wrote dist/wrangler.html (${(page.length / 1024 / 1024).toFixed(2)} MB)`);

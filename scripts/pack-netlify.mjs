// Makes dist/ a self-contained Netlify drag-and-drop deploy:
// the built site + SPA redirects + the Supabase proxy function.
import { cp, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";

const dist = fileURLToPath(new URL("../dist", import.meta.url));
const functionsSrc = fileURLToPath(new URL("../netlify/functions", import.meta.url));

await mkdir(`${dist}/netlify/functions`, { recursive: true });
await cp(functionsSrc, `${dist}/netlify/functions`, { recursive: true });

await writeFile(
  `${dist}/netlify.toml`,
  `# Included in the uploaded folder so manual (drag-and-drop) deploys keep the
# Supabase proxy function. The dropped folder itself is the publish directory.
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
`,
);

// SPA fallback. /api/* is excluded so the function keeps handling it.
await writeFile(`${dist}/_redirects`, `/api/*  /.netlify/functions/:splat  200\n/*  /index.html  200\n`);

console.log("dist/ packaged for Netlify (function + redirects included)");

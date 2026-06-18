import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// A unique id for THIS build. The running app compares this against the
// server's version.json and auto-refreshes if it's behind — so nobody ever
// gets stuck on an old cached design.
const BUILD_ID = Date.now().toString();

// Writes version.json into the build output so the live app can detect updates.
function emitVersion() {
  return {
    name: 'emit-version',
    writeBundle(options) {
      const dir = options.dir || 'dist';
      try {
        writeFileSync(join(dir, 'version.json'), JSON.stringify({ build: BUILD_ID }));
      } catch {}
    },
  };
}

// Block any attempt to fetch raw plaintext content / config files via the dev
// server. Only the encrypted __payload.js, runtime code, and assets are allowed.
function blockSensitivePaths() {
  const forbiddenPatterns = [
    /\/content-source\b/,         // raw plan text — must never leak
    /\.password\.json/,            // build-time password file
    /\/scripts\/encrypt-content/,  // build script
    /\.env(\.|$)/,                 // any env files
  ];
  return {
    name: 'block-sensitive-paths',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = (req.url || '').split('?')[0];
        if (forbiddenPatterns.some((re) => re.test(url))) {
          res.statusCode = 404;
          res.end('Not Found');
          return;
        }
        next();
      });
    },
  };
}

// Build everything into a single self-contained HTML file. All assets inline.
// The plan content has been pre-encrypted; only the ciphertext is bundled.
export default defineConfig({
  plugins: [react(), blockSensitivePaths(), viteSingleFile(), emitVersion()],
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000,
    sourcemap: false, // no source maps in production
    minify: 'esbuild',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        manualChunks: undefined,
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    fs: {
      // Don't let any dev-server request escape outside the project root
      strict: true,
      // Explicitly deny dotfiles and our content-source folder
      deny: ['.env', '.env.*', '.password.json', 'content-source/**', '**/.password.json'],
    },
  },
});

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// PostCSS plugin: regulile @media care țintesc lățimi de mobil (max-width <= 1024px)
// sunt restrânse la dispozitive touch primare (pointer: coarse, hover: none).
// Astfel, pe browser-ele desktop, layout-ul mobil nu se mai activează indiferent de
// lățimea ferestrei. Regulile desktop-tier (ex. `min-width: 1025px and max-width: 1200px`)
// sau cele cu max-width > 1024 NU sunt afectate, ca să poată ajusta în continuare
// layout-ul desktop pe ferestre înguste.
// Trebuie să rămână sincronizat cu logica din `src/utils/devicePatch.js`.
const MAX_WIDTH_VALUE_RE = /max-width\s*:\s*(\d+(?:\.\d+)?)\s*px/i;
const ALREADY_GATED_RE = /(pointer|hover)\s*:/i;
const TOUCH_GATE = '(pointer: coarse) and (hover: none)';
const MOBILE_MAX_WIDTH = 1024;

const isMobileTargetedQuery = (queryPart) => {
  if (ALREADY_GATED_RE.test(queryPart)) return false;
  const match = queryPart.match(MAX_WIDTH_VALUE_RE);
  if (!match) return false;
  return parseFloat(match[1]) <= MOBILE_MAX_WIDTH;
};

const gateMobileMediaQueries = () => ({
  postcssPlugin: 'gate-mobile-media-queries',
  AtRule: {
    media: (atRule) => {
      const params = atRule.params;
      const next = params
        .split(',')
        .map((q) => q.trim())
        .map((q) => (isMobileTargetedQuery(q) ? `${q} and ${TOUCH_GATE}` : q))
        .join(', ');
      if (next !== params) {
        atRule.params = next;
      }
    },
  },
});
gateMobileMediaQueries.postcss = true;

export default defineConfig(({ mode }) => {
  // Încarcă variabilele de mediu bazate pe `mode` (dev/prod)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    publicDir: 'public',
    optimizeDeps: {
      include: ['react-slick']
    },
    css: {
      postcss: {
        plugins: [gateMobileMediaQueries()]
      }
    },
    server: {
      proxy: {
        '/api': 'http://localhost:3000',
        '/auth': 'http://localhost:3000',
        '/uploads': 'http://localhost:3000',
      }
    },
    build: {
      assetsInclude: ['**/*.{jpg,jpeg,png,webp,svg}'],
      commonjsOptions: {
        include: [/react-slick/, /node_modules/]
      },
      rollupOptions: {
        output: {
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
      }
    }
  };
});
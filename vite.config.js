import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function netlifyFunctionsPlugin() {
  return {
    name: 'netlify-functions-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/.netlify/functions/analyze')) {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', async () => {
            try {
              const { pathToFileURL } = await import('url');
              const functionPath = pathToFileURL(path.resolve(__dirname, 'netlify/functions/analyze.js')).href;
              const analyzeModule = await import(functionPath);
              const handler = analyzeModule.handler || analyzeModule.default;

              const event = {
                httpMethod: req.method,
                headers: req.headers,
                body: body
              };

              const result = await handler(event);
              res.statusCode = result.statusCode || 200;
              if (result.headers) {
                for (const [key, val] of Object.entries(result.headers)) {
                  res.setHeader(key, val);
                }
              }
              res.end(result.body || '');
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message || 'Server error executing analyze function' }));
            }
          });
        } else {
          next();
        }
      });
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.GEMINI_API_KEY) {
    process.env.GEMINI_API_KEY = env.GEMINI_API_KEY;
  }
  if (env.NVIDIA_API_KEY) {
    process.env.NVIDIA_API_KEY = env.NVIDIA_API_KEY;
  }

  return {
    optimizeDeps: {
      exclude: ['jspdf']
    },
    server: {
      host: '127.0.0.1',
      port: 5173
    },
    plugins: [react(), tailwindcss(), netlifyFunctionsPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    }
  };
});

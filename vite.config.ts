import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      // CSP permissivo para MercadoPago e Stripe
      'Content-Security-Policy': mode === 'development' ? 
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://m.stripe.network https://www.mercadopago.com https://www.mercadolibre.com https://secure.mlstatic.com blob:; connect-src 'self' https: wss: ws:;" : 
        undefined
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

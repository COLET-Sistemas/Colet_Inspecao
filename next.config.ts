import type { NextConfig } from 'next';

//const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  productionBrowserSourceMaps: false,

  // Permite carregar imagens de domínios específicos
  images: {
    domains: ['10.0.0.248'], // ajuste para outros domínios se necessário
  },

  // Esse atributo afeta apenas tags <script> e <link>, não o fetch/cookies
  crossOrigin: 'anonymous',

  // Headers HTTP globais
  headers: async () => {
    return [
      {
        source: '/(.*)', // Aplica para todas as rotas
        headers: [
          // CORS para permitir cookies em ambiente local
          {
            key: 'Access-Control-Allow-Origin',
            value: 'http://10.0.0.248:3001', // Altere se o frontend estiver em outra porta
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,POST,PUT,DELETE,OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },

          // Segurança mínima (pode ser ampliada para produção)
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },

          // Controle de cache (útil para login/token dinâmico)
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
      {
        source: '/api/:path*', // Cache específico para rotas de API
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate, private',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

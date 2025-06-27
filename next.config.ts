import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  reactStrictMode: true,
  //swcMinify: true,
  compress: true,
  // Configuração específica para ambientes de produção
  productionBrowserSourceMaps: false, // Desabilita source maps em produção para melhor performance

  // Configurações para melhor gerenciamento de sessão e cookies
  headers: async () => {
    return [
      {
        // Aplica estas configurações para todas as rotas
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          // Headers para melhorar a segurança e permitir o funcionamento adequado de cookies
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      },
      {
        // Configurações especiais para rotas de API
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate, private'
          }
        ]
      }
    ];
  }
};

export default nextConfig;

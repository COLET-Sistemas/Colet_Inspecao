import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  // Configuração específica para ambientes de produção
  productionBrowserSourceMaps: false, // Desabilita source maps em produção para melhor performance
  // Configurações para melhor gerenciamento de sessão
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
          }
        ]
      }
    ];
  }
};

export default nextConfig;

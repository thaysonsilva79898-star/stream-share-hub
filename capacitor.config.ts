import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.thaysontv',
  appName: 'Thayson TV',
  webDir: 'dist',
  server: {
    url: 'https://0b9d8d5e-17e5-482f-a7a7-175ceb2e00cc.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;

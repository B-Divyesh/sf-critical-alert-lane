import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.sociobot.criticalalertlane',
  appName: 'Critical Alert Lane',
  webDir: 'dist',
  backgroundColor: '#F2E9D0',
  android: {
    backgroundColor: '#F2E9D0',
    allowMixedContent: false
  }
};

export default config;

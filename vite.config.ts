import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { rmSync } from 'node:fs';

export default defineConfig(({ mode }) => {
  const nativeBuild = mode === 'native';
  const outDir = nativeBuild ? 'dist-native' : 'dist';
  return {
    define: { __NATIVE_BUILD__: JSON.stringify(nativeBuild) },
    plugins: nativeBuild ? [{
      name: 'exclude-downloadable-apks-from-native-shell',
      closeBundle() {
        rmSync(resolve(__dirname, outDir, 'downloads'), { recursive: true, force: true });
      }
    }] : [],
    build: {
      outDir,
      target: 'es2022',
      sourcemap: !nativeBuild,
      rollupOptions: {
        input: {
          app: resolve(__dirname, 'index.html'),
          demo: resolve(__dirname, 'demo/index.html'),
          privacy: resolve(__dirname, 'privacy/index.html'),
          terms: resolve(__dirname, 'terms/index.html'),
          offline: resolve(__dirname, 'offline.html'),
          notFound: resolve(__dirname, '404.html')
        }
      }
    }
  };
});

import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';

export default defineConfig(({ mode }) => {
  const nativeBuild = mode === 'native';
  const outDir = nativeBuild ? 'dist-native' : 'dist';
  // Native builds receive an empty digest: an APK must not contain a hash of
  // itself. The public site reads the completed archive's digest instead.
  const apk = resolve(__dirname, 'public/downloads/critical-alert-lane-1.0.4.apk');
  const apkDigest = nativeBuild ? '' : (() => {
    try { return createHash('sha256').update(readFileSync(apk)).digest('hex'); }
    catch { return ''; }
  })();
  return {
    define: {
      __NATIVE_BUILD__: JSON.stringify(nativeBuild),
      __ANDROID_APK_SHA256__: JSON.stringify(apkDigest)
    },
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

import { defineConfig, lazyPlugins } from 'vite-plus';

import { foldkit } from '@foldkit/vite-plugin';
import { unplugin as stylex } from '@stylexjs/unplugin';

export default defineConfig({
  plugins:
    lazyPlugins(() => [
      // Under Vitest, StyleX's Vite adapter keeps a timer for live CSS reloads that holds the test run open; its Rolldown adapter compiles alike without one.
      process.env['VITEST'] === undefined ? stylex.vite() : stylex.rolldown(),
      foldkit({
        ssr: {
          serverEntry: '/src/entry.server.ts',
          clientEntry: '/src/entry.ts',
          build: true,
        },
      }),
    ]) ?? [],
  optimizeDeps: {
    entries: ['src/entry.ts'],
  },
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    environment: 'happy-dom',
    setupFiles: ['./src/vitest-setup.ts'],
    server: {
      deps: {
        inline: ['foldkit', '@foldkit/ui', '@foldkit/devtools'],
      },
    },
  },
});

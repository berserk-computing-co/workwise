import type { StorybookConfig } from '@storybook/nextjs-vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const mockUseJobProgress = path.resolve(
  __dirname,
  './mocks/use-job-progress.ts',
);

const config: StorybookConfig = {
  framework: '@storybook/nextjs-vite',
  stories: ['../stories/**/*.stories.@(tsx|ts)'],
  addons: ['@storybook/addon-a11y', 'msw-storybook-addon'],
  staticDirs: ['../../web/public'],
  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    return mergeConfig(config, {
      css: {
        postcss: {
          plugins: [
            (await import('tailwindcss')).default({
              config: path.resolve(__dirname, '../../web/tailwind.config.ts'),
            }),
          ],
        },
      },
      plugins: [
        // Intercept use-job-progress at the resolveId level (pre-phase) so it
        // works for both bare-specifier imports (@/app/hooks/use-job-progress)
        // and relative imports (../hooks/use-job-progress) used inside
        // progress-overlay.tsx. Aliases don't cover relative imports reliably
        // with @storybook/nextjs-vite.
        {
          name: 'storybook-mock-use-job-progress',
          enforce: 'pre' as const,
          resolveId(id: string) {
            if (/\/use-job-progress(\.ts)?$/.test(id)) {
              return mockUseJobProgress;
            }
          },
        },
      ],
      resolve: {
        alias: [
          // Replace @googlemaps/js-api-loader with a browser-safe mock that
          // reads from window.__mockGoogleMapsLib (set in story beforeEach).
          {
            find: '@googlemaps/js-api-loader',
            replacement: path.resolve(
              __dirname,
              './mocks/google-maps-loader.ts',
            ),
          },
          // Generic Next.js app alias — must come last.
          {
            find: '@',
            replacement: path.resolve(__dirname, '../../web'),
          },
        ],
      },
    });
  },
};

export default config;

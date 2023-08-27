import { defineConfig } from 'cypress';
import { initPlugin } from '@frsource/cypress-plugin-visual-regression-diff/plugins';

export default defineConfig({
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  e2e: {
    baseUrl: 'http://localhost:5173',
    setupNodeEvents(on, config) {
      initPlugin(on, config);
    },
  },
  retries: {
    // Retry attempts during (CI) runs for flaky tests
    runMode: 2,
  },
  env: {
    // We tolerate higher diff in CI due to missing fonts
    pluginVisualRegressionMaxDiffThreshold: process.env.CI ? 0.2 : 0.01,
  },
});

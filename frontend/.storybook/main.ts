import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
  ],
  framework: '@storybook/angular',
  staticDirs: ['../src/assets'],
  core: {
    disableTelemetry: true,
  },
  features: {
    storyStoreV7: true,
    buildStoriesJson: true,
  },
};

export default config;

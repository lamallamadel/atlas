module.exports = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx)'
  ],

  addons: ['@storybook/addon-links', '@storybook/addon-a11y', '@storybook/addon-docs'],

  framework: {
    name: '@storybook/angular',
    options: {}
  },

  staticDirs: ['../src/assets'],

  core: {
    disableTelemetry: true
  },

  features: {
    storyStoreV7: true,
    buildStoriesJson: true
  }
};

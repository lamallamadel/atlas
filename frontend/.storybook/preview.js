import { setCompodocJson } from '@storybook/addon-docs/angular';
import '../src/styles.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
    expanded: true,
    sort: 'requiredFirst'
  },
  backgrounds: {
    default: 'light',
    values: [
      {
        name: 'light',
        value: '#ffffff',
      },
      {
        name: 'gray',
        value: '#f5f5f5',
      },
      {
        name: 'dark',
        value: '#1a1a1a',
      },
    ],
  },
  viewport: {
    viewports: {
      mobile: {
        name: 'Mobile',
        styles: {
          width: '375px',
          height: '667px',
        },
      },
      tablet: {
        name: 'Tablet',
        styles: {
          width: '768px',
          height: '1024px',
        },
      },
      desktop: {
        name: 'Desktop',
        styles: {
          width: '1280px',
          height: '800px',
        },
      },
      wide: {
        name: 'Wide',
        styles: {
          width: '1920px',
          height: '1080px',
        },
      },
    },
  },
  layout: 'padded',
  options: {
    storySort: {
      order: [
        'Introduction',
        'Design Tokens',
        ['Colors', 'Typography', 'Spacing', 'Shadows', 'Overview'],
        'Guidelines',
        ['Accessibility', 'Best Practices', 'Do and Don\'t'],
        'Components',
        'Pages',
        '*'
      ],
    },
  },
  darkMode: {
    dark: { ...parameters?.backgrounds?.values?.[2], 
      appBg: '#1a1a1a',
      appContentBg: '#2d2d2d',
      barBg: '#2d2d2d',
      textColor: '#ffffff',
    },
    light: { ...parameters?.backgrounds?.values?.[0],
      appBg: '#ffffff',
      appContentBg: '#f5f5f5',
      barBg: '#ffffff',
      textColor: '#212121',
    }
  },
  a11y: {
    config: {},
    options: {
      checks: { 'color-contrast': { options: { noScroll: true } } },
      restoreScroll: true,
    },
  },
};

// Global decorators
export const decorators = [
  (story, context) => {
    const isDark = context.globals.backgrounds?.value === '#1a1a1a';
    
    if (isDark) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    
    return story();
  },
];

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Global theme for components',
    defaultValue: 'light',
    toolbar: {
      icon: 'circlehollow',
      items: ['light', 'dark'],
      showName: true,
    },
  },
};

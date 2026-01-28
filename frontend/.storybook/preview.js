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
        ['Overview', 'Colors', 'Typography', 'Spacing', 'Shadows', 'Border Radius', 'Animations'],
        'Guidelines',
        ['Accessibility', 'Best Practices', 'Do and Don\'t'],
        'Components',
        ['Buttons', 'Forms', 'Cards', 'Badges', 'Dialogs', 'Charts', 'Icons', 'Loading States', 'Empty States', 'Illustrations'],
        'Pages',
        '*'
      ],
    },
  },
  a11y: {
    config: {
      rules: [
        {
          id: 'color-contrast',
          enabled: true,
        },
        {
          id: 'button-name',
          enabled: true,
        },
        {
          id: 'aria-allowed-attr',
          enabled: true,
        },
      ]
    },
    options: {
      checks: { 'color-contrast': { options: { noScroll: true } } },
      restoreScroll: true,
    },
  },
};

// Global decorators
export const decorators = [
  (story, context) => {
    const isDark = context.globals.backgrounds?.value === '#1a1a1a' || context.globals.theme === 'dark';
    
    if (isDark) {
      document.body.classList.add('dark-theme');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      document.documentElement.setAttribute('data-theme', 'light');
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
      items: [
        { value: 'light', icon: 'sun', title: 'Light Theme' },
        { value: 'dark', icon: 'moon', title: 'Dark Theme' }
      ],
      showName: true,
      dynamicTitle: true,
    },
  },
};

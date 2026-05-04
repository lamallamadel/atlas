import type { Preview } from '@storybook/angular';
import { setCompodocJson } from '@storybook/addon-docs/angular';
import docJson from '../documentation.json';

/* Styles globaux : fournis par browserTarget (frontend:build:development) dans angular.json.
   Ne pas importer src/styles.scss ici : la chaîne webpack Storybook + sass échoue sur @charset
   sans css-loader adapté. */

setCompodocJson(docJson);

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
      sort: 'requiredFirst',
    },
    backgrounds: {
      options: {
        light: {
          name: 'light',
          value: '#ffffff',
        },
        gray: {
          name: 'gray',
          value: '#f5f5f5',
        },
        dark: {
          name: 'dark',
          value: '#1a1a1a',
        },
      },
    },
    viewport: {
      options: {
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
          'Design System',
          ['Platform', '3-Plateformes', 'Primitives', 'Icons'],
          'Design Tokens',
          ['Overview', 'Colors', 'Typography', 'Spacing', 'Shadows', 'Border Radius', 'Animations'],
          'Guidelines',
          ['Accessibility', 'Best Practices', "Do and Don't"],
          'Components',
          [
            'Buttons',
            'Forms',
            'Cards',
            'Badges',
            'Dialogs',
            'Charts',
            'Icons',
            'Loading States',
            'Empty States',
            'Illustrations',
          ],
          'Pages',
          '*',
        ],
      },
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'aria-allowed-attr', enabled: true },
        ],
      },
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },
  },
  decorators: [
    (story, context) => {
      const globals = context.globals as Record<string, unknown>;
      const backgrounds = globals['backgrounds'] as { value?: string } | undefined;
      const isDark =
        backgrounds?.value === '#1a1a1a' || globals['theme'] === 'dark';

      if (isDark) {
        document.body.classList.add('dark-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.body.classList.remove('dark-theme');
        document.documentElement.setAttribute('data-theme', 'light');
      }

      return story();
    },
  ],
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light Theme' },
          { value: 'dark', icon: 'moon', title: 'Dark Theme' },
        ],
      },
    },
  },
  initialGlobals: {
    backgrounds: {
      value: 'light',
    },
  },
};

export default preview;

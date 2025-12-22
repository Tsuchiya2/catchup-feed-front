import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: 'hsl(220 50% 4%)',
        },
        {
          name: 'light',
          value: 'hsl(210 20% 98%)',
        },
      ],
    },
    docs: {
      theme: themes.dark,
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div style={{ padding: '2rem' }}>
          <Story />
        </div>
      </div>
    ),
  ],
};

export default preview;

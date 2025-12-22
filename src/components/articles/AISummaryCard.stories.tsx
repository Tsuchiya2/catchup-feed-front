import type { Meta, StoryObj } from '@storybook/react';
import { AISummaryCard } from './AISummaryCard';

/**
 * AISummaryCard Component
 *
 * Displays AI-generated article summaries with cyber/glow theme styling.
 * Features an icon, title, summary text, and disclaimer footer.
 */
const meta = {
  title: 'Articles/AISummaryCard',
  component: AISummaryCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    summary: {
      control: 'text',
      description: 'The AI-generated summary text',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
} satisfies Meta<typeof AISummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default AI summary card
 */
export const Default: Story = {
  args: {
    summary:
      'This article introduces React Server Components, a new paradigm for building modern web applications. The author explains how server components can improve performance by reducing the amount of JavaScript sent to the client, while maintaining interactivity where needed. Key benefits include faster initial page loads, better SEO, and simplified data fetching patterns.',
  },
};

/**
 * Short summary
 */
export const ShortSummary: Story = {
  args: {
    summary: 'A brief overview of the latest Next.js features and improvements.',
  },
};

/**
 * Long detailed summary
 */
export const LongSummary: Story = {
  args: {
    summary: `This comprehensive article covers the evolution of web development frameworks over the past decade. The author begins by examining the rise of single-page applications (SPAs) and the challenges they introduced, particularly around initial load times and SEO.

The article then explores how modern frameworks like Next.js and Remix have addressed these challenges through server-side rendering (SSR) and static site generation (SSG). The author provides detailed examples of when to use each approach, including performance benchmarks and real-world case studies.

In the final section, the article looks ahead to emerging patterns like React Server Components and streaming SSR. The author discusses how these technologies promise to combine the best aspects of traditional server rendering with the rich interactivity of client-side applications, while minimizing the JavaScript bundle size sent to users.`,
  },
};

/**
 * Summary with line breaks
 */
export const WithLineBreaks: Story = {
  args: {
    summary: `Key points covered in this article:

1. Introduction to TypeScript's type system
2. Advanced generic patterns and constraints
3. Utility types and their practical applications
4. Best practices for type-safe code

The author emphasizes the importance of leveraging TypeScript's full capabilities to catch errors at compile time rather than runtime.`,
  },
};

/**
 * Empty summary (edge case)
 */
export const EmptySummary: Story = {
  args: {
    summary: '',
  },
};

/**
 * Summary with special characters
 */
export const SpecialCharacters: Story = {
  args: {
    summary:
      "This article discusses how to handle special characters in web applications: <, >, &, \", and '. The author provides examples using React's JSX syntax and explains the importance of proper escaping to prevent XSS vulnerabilities.",
  },
};

/**
 * Technical summary with code terminology
 */
export const TechnicalSummary: Story = {
  args: {
    summary:
      'This tutorial demonstrates how to implement JWT authentication in Next.js applications. It covers token generation using jsonwebtoken, secure storage in httpOnly cookies, and middleware-based route protection. The author also explains refresh token rotation and best practices for handling token expiration.',
  },
};

/**
 * Multiple summary cards showcase
 */
export const MultipleSummaries: Story = {
  render: () => (
    <div className="flex flex-col gap-6 max-w-3xl">
      <AISummaryCard summary="First article summary: An introduction to modern web development practices and tools." />
      <AISummaryCard summary="Second article summary: Deep dive into React hooks and their usage patterns in functional components." />
      <AISummaryCard summary="Third article summary: Performance optimization techniques for large-scale React applications, including code splitting and lazy loading." />
    </div>
  ),
};

/**
 * Summary card with custom styling
 */
export const CustomStyling: Story = {
  args: {
    summary: 'Custom styled AI summary card with additional classes.',
    className: 'border-2 border-primary shadow-glow-lg',
  },
};

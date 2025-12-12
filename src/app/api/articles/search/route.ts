import { NextRequest, NextResponse } from 'next/server';
import type { Article, PaginatedArticlesResponse } from '@/types/api';

/**
 * Generate a datetime string for a specific day and hour
 */
function getDateTimeAtHour(daysAgo: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

/**
 * Mock articles data with various dates (today and past 7 days)
 */
function getMockArticles(): Article[] {
  return [
    // Today's articles (3 articles)
    {
      id: 1,
      source_id: 1,
      source_name: 'Tech News',
      title: 'Breaking: New AI Model Released Today',
      url: 'https://example.com/article/1',
      summary:
        'A major AI company has announced the release of their latest language model today, featuring improved performance and efficiency. The new model demonstrates significant improvements in reasoning and coding tasks.',
      published_at: getDateTimeAtHour(0, 9),
      created_at: getDateTimeAtHour(0, 9),
    },
    {
      id: 2,
      source_id: 2,
      source_name: 'Developer Blog',
      title: 'React 20 Released with Exciting New Features',
      url: 'https://example.com/article/2',
      summary:
        'The React team has released version 20 today with several new features including improved server components, better TypeScript support, and enhanced performance optimizations for large applications.',
      published_at: getDateTimeAtHour(0, 11),
      created_at: getDateTimeAtHour(0, 11),
    },
    {
      id: 3,
      source_id: 1,
      source_name: 'Tech News',
      title: 'Cloud Computing Trends for 2025',
      url: 'https://example.com/article/3',
      summary:
        'Industry experts discuss the top cloud computing trends expected to dominate in 2025, including serverless architecture, edge computing, and multi-cloud strategies for enterprise applications.',
      published_at: getDateTimeAtHour(0, 14),
      created_at: getDateTimeAtHour(0, 14),
    },
    // Yesterday's articles (2 articles)
    {
      id: 4,
      source_id: 2,
      source_name: 'Developer Blog',
      title: 'TypeScript 6.0 Beta: What Developers Need to Know',
      url: 'https://example.com/article/4',
      summary:
        'Microsoft announces TypeScript 6.0 beta with groundbreaking features including improved type inference, faster compilation, and better integration with modern JavaScript frameworks.',
      published_at: getDateTimeAtHour(1, 10),
      created_at: getDateTimeAtHour(1, 10),
    },
    {
      id: 5,
      source_id: 1,
      source_name: 'Tech News',
      title: 'Cybersecurity Best Practices for Remote Teams',
      url: 'https://example.com/article/5',
      summary:
        'Security experts share essential cybersecurity practices for remote and hybrid teams, covering VPN usage, multi-factor authentication, and secure communication tools.',
      published_at: getDateTimeAtHour(1, 15),
      created_at: getDateTimeAtHour(1, 15),
    },
    // 2 days ago (2 articles)
    {
      id: 6,
      source_id: 1,
      source_name: 'Tech News',
      title: 'Machine Learning in Healthcare: Recent Advances',
      url: 'https://example.com/article/6',
      summary:
        'Healthcare institutions are increasingly adopting machine learning solutions for diagnostics, treatment planning, and patient care optimization.',
      published_at: getDateTimeAtHour(2, 9),
      created_at: getDateTimeAtHour(2, 9),
    },
    {
      id: 7,
      source_id: 2,
      source_name: 'Developer Blog',
      title: 'Building Scalable APIs with GraphQL',
      url: 'https://example.com/article/7',
      summary:
        'A comprehensive guide to building performant and scalable APIs using GraphQL, including best practices for schema design, caching, and error handling.',
      published_at: getDateTimeAtHour(2, 14),
      created_at: getDateTimeAtHour(2, 14),
    },
    // 3 days ago (1 article)
    {
      id: 8,
      source_id: 1,
      source_name: 'Tech News',
      title: 'The Future of Quantum Computing',
      url: 'https://example.com/article/8',
      summary:
        'Researchers discuss recent breakthroughs in quantum computing and potential applications in cryptography, drug discovery, and climate modeling.',
      published_at: getDateTimeAtHour(3, 11),
      created_at: getDateTimeAtHour(3, 11),
    },
    // 5 days ago (2 articles)
    {
      id: 9,
      source_id: 2,
      source_name: 'Developer Blog',
      title: 'Next.js 15: A Deep Dive into New Features',
      url: 'https://example.com/article/9',
      summary:
        'Exploring the latest features in Next.js 15 including improved server actions, enhanced caching strategies, and better developer experience.',
      published_at: getDateTimeAtHour(5, 10),
      created_at: getDateTimeAtHour(5, 10),
    },
    {
      id: 10,
      source_id: 1,
      source_name: 'Tech News',
      title: 'Open Source Software: Economic Impact Report',
      url: 'https://example.com/article/10',
      summary:
        'New research reveals the significant economic impact of open source software, with contributions valued at billions of dollars annually.',
      published_at: getDateTimeAtHour(5, 16),
      created_at: getDateTimeAtHour(5, 16),
    },
    // 7 days ago (1 article)
    {
      id: 11,
      source_id: 2,
      source_name: 'Developer Blog',
      title: 'Microservices vs Monolith: Making the Right Choice',
      url: 'https://example.com/article/11',
      summary:
        'An in-depth comparison of microservices and monolithic architectures, helping teams decide which approach best fits their project requirements.',
      published_at: getDateTimeAtHour(7, 13),
      created_at: getDateTimeAtHour(7, 13),
    },
    // 10 days ago (older article, outside Last 7 Days)
    {
      id: 12,
      source_id: 1,
      source_name: 'Tech News',
      title: 'Database Performance Optimization Techniques',
      url: 'https://example.com/article/12',
      summary:
        'Expert tips on optimizing database performance including indexing strategies, query optimization, and caching mechanisms for high-traffic applications.',
      published_at: getDateTimeAtHour(10, 9),
      created_at: getDateTimeAtHour(10, 9),
    },
  ];
}

/**
 * Filter articles based on search parameters
 */
function filterArticles(
  articles: Article[],
  params: {
    keyword?: string;
    source_id?: number;
    from?: string;
    to?: string;
  }
): Article[] {
  let filtered = [...articles];

  // Filter by keyword
  if (params.keyword) {
    const keyword = params.keyword.toLowerCase();
    filtered = filtered.filter(
      (article) =>
        article.title.toLowerCase().includes(keyword) ||
        article.summary.toLowerCase().includes(keyword)
    );
  }

  // Filter by source_id
  if (params.source_id) {
    filtered = filtered.filter((article) => article.source_id === params.source_id);
  }

  // Filter by date range
  if (params.from) {
    const fromDate = new Date(params.from);
    fromDate.setHours(0, 0, 0, 0);
    filtered = filtered.filter((article) => new Date(article.published_at) >= fromDate);
  }

  if (params.to) {
    const toDate = new Date(params.to);
    toDate.setHours(23, 59, 59, 999);
    filtered = filtered.filter((article) => new Date(article.published_at) <= toDate);
  }

  return filtered;
}

/**
 * Article search endpoint (mock implementation)
 *
 * @route GET /api/articles/search
 * @query keyword - Search keyword
 * @query source_id - Filter by source ID
 * @query from - Start date (YYYY-MM-DD)
 * @query to - End date (YYYY-MM-DD)
 * @query page - Page number (default: 1)
 * @query limit - Items per page (default: 10)
 * @returns Paginated articles response
 */
export async function GET(request: NextRequest): Promise<NextResponse<PaginatedArticlesResponse>> {
  const { searchParams } = new URL(request.url);

  // Parse query parameters
  const keyword = searchParams.get('keyword') || undefined;
  const sourceIdStr = searchParams.get('source_id');
  const source_id = sourceIdStr ? parseInt(sourceIdStr, 10) : undefined;
  const from = searchParams.get('from') || undefined;
  const to = searchParams.get('to') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  // Get mock articles and filter
  const allArticles = getMockArticles();
  const filteredArticles = filterArticles(allArticles, { keyword, source_id, from, to });

  // Paginate results
  const total = filteredArticles.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedArticles = filteredArticles.slice(startIndex, endIndex);

  const response: PaginatedArticlesResponse = {
    data: paginatedArticles,
    pagination: {
      page,
      limit,
      total,
      total_pages: totalPages,
    },
  };

  return NextResponse.json(response);
}

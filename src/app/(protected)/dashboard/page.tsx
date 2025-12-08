'use client';

import * as React from 'react';
import { FileText, Rss } from 'lucide-react';
import { StatisticsCard } from '@/components/dashboard/StatisticsCard';
import { RecentArticlesList } from '@/components/dashboard/RecentArticlesList';
import { ErrorMessage } from '@/components/common/ErrorMessage';
import { useDashboardStats } from '@/hooks/useDashboardStats';

/**
 * Dashboard Page
 *
 * Protected page that displays user statistics and recent articles.
 * Features cyber/tech theme matching the brand.
 * Requires authentication - unauthenticated users will be redirected by middleware.
 */
export default function DashboardPage() {
  const { stats, isLoading, error } = useDashboardStats();

  return (
    <div className="container py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-glow-sm text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-muted-foreground">Your personalized news feed overview</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6">
          <ErrorMessage error={error} onRetry={() => window.location.reload()} />
        </div>
      )}

      {/* Statistics Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <StatisticsCard
          title="Total Articles"
          value={stats.totalArticles}
          icon={<FileText className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <StatisticsCard
          title="Total Sources"
          value={stats.totalSources}
          icon={<Rss className="h-4 w-4" />}
          isLoading={isLoading}
        />
      </div>

      {/* Recent Articles List */}
      <RecentArticlesList articles={stats.recentArticles} isLoading={isLoading} />
    </div>
  );
}

import { NextResponse } from 'next/server';

/**
 * Application metrics for Prometheus monitoring
 */
interface AppMetrics {
  // Process metrics
  process_uptime_seconds: number;
  process_memory_heap_used_bytes: number;
  process_memory_heap_total_bytes: number;
  process_memory_rss_bytes: number;

  // Application info
  app_info: {
    version: string;
    environment: string;
    node_version: string;
  };

  // Request counters (placeholder for future implementation)
  http_requests_total: number;
  http_request_errors_total: number;
}

/**
 * Get current memory usage
 */
function getMemoryMetrics(): { heapUsed: number; heapTotal: number; rss: number } {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const mem = process.memoryUsage();
    return {
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
      rss: mem.rss,
    };
  }
  return { heapUsed: 0, heapTotal: 0, rss: 0 };
}

/**
 * Format metrics in Prometheus exposition format
 */
function formatPrometheusMetrics(metrics: AppMetrics): string {
  const lines: string[] = [];

  // Process uptime
  lines.push('# HELP process_uptime_seconds The uptime of the process in seconds');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${metrics.process_uptime_seconds}`);

  // Memory metrics
  lines.push('# HELP process_memory_heap_used_bytes Process heap memory used in bytes');
  lines.push('# TYPE process_memory_heap_used_bytes gauge');
  lines.push(`process_memory_heap_used_bytes ${metrics.process_memory_heap_used_bytes}`);

  lines.push('# HELP process_memory_heap_total_bytes Process total heap memory in bytes');
  lines.push('# TYPE process_memory_heap_total_bytes gauge');
  lines.push(`process_memory_heap_total_bytes ${metrics.process_memory_heap_total_bytes}`);

  lines.push('# HELP process_memory_rss_bytes Process resident set size in bytes');
  lines.push('# TYPE process_memory_rss_bytes gauge');
  lines.push(`process_memory_rss_bytes ${metrics.process_memory_rss_bytes}`);

  // Application info
  lines.push('# HELP app_info Application information');
  lines.push('# TYPE app_info gauge');
  lines.push(
    `app_info{version="${metrics.app_info.version}",environment="${metrics.app_info.environment}",node_version="${metrics.app_info.node_version}"} 1`
  );

  // Request counters
  lines.push('# HELP http_requests_total Total number of HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  lines.push(`http_requests_total ${metrics.http_requests_total}`);

  lines.push('# HELP http_request_errors_total Total number of HTTP request errors');
  lines.push('# TYPE http_request_errors_total counter');
  lines.push(`http_request_errors_total ${metrics.http_request_errors_total}`);

  return lines.join('\n');
}

/**
 * Metrics endpoint for Prometheus scraping
 *
 * @route GET /api/metrics
 * @returns Prometheus-format metrics
 */
export async function GET(): Promise<NextResponse> {
  const memory = getMemoryMetrics();

  const metrics: AppMetrics = {
    process_uptime_seconds: process.uptime(),
    process_memory_heap_used_bytes: memory.heapUsed,
    process_memory_heap_total_bytes: memory.heapTotal,
    process_memory_rss_bytes: memory.rss,
    app_info: {
      version: process.env.npm_package_version || '1.6.0',
      environment: process.env.NODE_ENV || 'development',
      node_version: process.version,
    },
    // Placeholder counters - in production, these would be tracked via middleware
    http_requests_total: 0,
    http_request_errors_total: 0,
  };

  const prometheusOutput = formatPrometheusMetrics(metrics);

  return new NextResponse(prometheusOutput, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}

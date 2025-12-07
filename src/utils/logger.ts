/**
 * Article Migration Logger
 *
 * Structured logging for article source_name migration.
 * Provides consistent logging format for debugging and monitoring.
 */

/**
 * Logger for article migration events.
 * Used to track source_name field handling during migration period.
 */
export const ArticleMigrationLogger = {
  /**
   * Warns when source_name is missing from an article.
   */
  warnMissingSourceName(articleId: number, context: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[ArticleMigration] Missing source_name for article ${articleId} in ${context}`,
        { articleId, context, timestamp: new Date().toISOString() }
      );
    }
  },

  /**
   * Logs validation failure for an article.
   */
  errorValidationFailed(articleId: number, error: string): void {
    console.error(`[ArticleMigration] Validation failed for article ${articleId}: ${error}`, {
      articleId,
      error,
      timestamp: new Date().toISOString(),
    });
  },

  /**
   * Logs when source_name is normalized (e.g., from null to "Unknown Source").
   */
  infoSourceNameNormalized(
    articleId: number,
    original: string | null | undefined,
    normalized: string
  ): void {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[ArticleMigration] Source name normalized for article ${articleId}`, {
        articleId,
        original,
        normalized,
        timestamp: new Date().toISOString(),
      });
    }
  },

  /**
   * Debug log for API response processing.
   */
  debugApiResponse(endpoint: string, articleCount: number): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[ArticleMigration] API response from ${endpoint}: ${articleCount} articles`, {
        endpoint,
        articleCount,
        timestamp: new Date().toISOString(),
      });
    }
  },
};

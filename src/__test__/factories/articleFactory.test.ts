/**
 * Article Factory Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createMockArticle,
  createMockArticles,
  createMockArticleWithSourceEdgeCase,
} from './articleFactory';

describe('articleFactory', () => {
  describe('createMockArticle', () => {
    it('should create a default mock article', () => {
      const article = createMockArticle();

      expect(article).toHaveProperty('id');
      expect(article).toHaveProperty('source_name');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('url');
      expect(article).toHaveProperty('summary');
      expect(article).toHaveProperty('published_at');
      expect(article).toHaveProperty('created_at');
    });

    it('should allow overriding properties', () => {
      const article = createMockArticle({
        id: 999,
        title: 'Custom Title',
      });

      expect(article.id).toBe(999);
      expect(article.title).toBe('Custom Title');
      expect(article.source_name).toBe('Tech Blog'); // default value
    });
  });

  describe('createMockArticles', () => {
    it('should create multiple mock articles with sequential IDs', () => {
      const articles = createMockArticles(3);

      expect(articles).toHaveLength(3);
      expect(articles[0]?.id).toBe(1);
      expect(articles[1]?.id).toBe(2);
      expect(articles[2]?.id).toBe(3);
    });

    it('should apply overrides to specific articles', () => {
      const articles = createMockArticles(2, [
        { title: 'First Custom' },
        { title: 'Second Custom' },
      ]);

      expect(articles[0]?.title).toBe('First Custom');
      expect(articles[1]?.title).toBe('Second Custom');
    });
  });

  describe('createMockArticleWithSourceEdgeCase', () => {
    it('should create article with empty source name', () => {
      const article = createMockArticleWithSourceEdgeCase('empty');
      expect(article.source_name).toBe('');
    });

    it('should create article with whitespace source name', () => {
      const article = createMockArticleWithSourceEdgeCase('whitespace');
      expect(article.source_name).toBe('   ');
    });

    it('should create article with long source name', () => {
      const article = createMockArticleWithSourceEdgeCase('long');
      expect(article.source_name).toHaveLength(200);
    });

    it('should create article with unicode source name', () => {
      const article = createMockArticleWithSourceEdgeCase('unicode');
      expect(article.source_name).toBe('テックブログ 🚀');
    });
  });
});

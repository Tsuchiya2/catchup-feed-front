/**
 * Pagination Component
 *
 * A comprehensive pagination component with:
 * - Previous/Next navigation buttons
 * - Page number buttons with ellipsis for large page counts
 * - Mobile-responsive design (simplified on small screens)
 * - Items shown counter (e.g., "Showing 1-10 of 50 items")
 * - Full accessibility support with ARIA labels
 */
import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { PAGINATION_CONFIG } from '@/lib/constants/pagination';

/**
 * Props for the Pagination component
 */
interface PaginationProps {
  /** Current active page (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Total number of items (for "Showing X-Y of Z" text) */
  totalItems?: number;
  /** Number of items per page (for "Showing X-Y of Z" text) */
  itemsPerPage?: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when items per page changes */
  onItemsPerPageChange?: (limit: number) => void;
  /** Available page size options */
  availablePageSizes?: readonly number[];
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className,
  onItemsPerPageChange,
  availablePageSizes = PAGINATION_CONFIG.AVAILABLE_PAGE_SIZES,
}: PaginationProps) {
  // Memoize page numbers calculation to avoid recalculation on every render
  const pageNumbers = React.useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage <= 3) {
        // Near the beginning
        pages.push(2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // In the middle
        pages.push(
          'ellipsis',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          'ellipsis',
          totalPages
        );
      }
    }

    return pages;
  }, [currentPage, totalPages]);

  // Memoize items shown text calculation
  const itemsShownText = React.useMemo(() => {
    if (!totalItems || !itemsPerPage) return null;

    const start = (currentPage - 1) * itemsPerPage + 1;
    const end = Math.min(currentPage * itemsPerPage, totalItems);

    return `Showing ${start}-${end} of ${totalItems} items`;
  }, [currentPage, totalItems, itemsPerPage]);

  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination navigation"
      className={cn('flex flex-col items-center gap-4', className)}
    >
      {/* Page buttons */}
      <div className="flex items-center gap-1">
        {/* Previous button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Go to previous page"
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Page number buttons */}
        <div className="hidden items-center gap-1 md:flex">
          {pageNumbers.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="flex h-9 w-9 items-center justify-center text-sm text-muted-foreground"
                  aria-hidden="true"
                >
                  ...
                </span>
              );
            }

            return (
              <Button
                key={page}
                variant={currentPage === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-label={`Go to page ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
                className="h-9 w-9 p-0"
              >
                {page}
              </Button>
            );
          })}
        </div>

        {/* Mobile: Current page indicator */}
        <div className="flex items-center gap-2 md:hidden">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Next button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Go to next page"
          className="gap-1"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Bottom section: Items shown text and items per page selector */}
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
        {/* Items shown text */}
        {itemsShownText && (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {itemsShownText}
          </p>
        )}

        {/* Items per page selector */}
        {onItemsPerPageChange && itemsPerPage && (
          <div className="flex items-center gap-2">
            <label
              htmlFor="items-per-page"
              className="text-sm text-muted-foreground whitespace-nowrap"
            >
              Items per page:
            </label>
            <select
              id="items-per-page"
              value={itemsPerPage.toString()}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="h-9 w-[70px] rounded-md border border-input bg-background px-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Select items per page"
            >
              {availablePageSizes.map((size) => (
                <option key={size} value={size.toString()}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </nav>
  );
}

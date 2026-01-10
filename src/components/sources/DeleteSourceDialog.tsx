'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDeleteSource } from '@/hooks/useDeleteSource';
import { SOURCE_TEST_IDS, SOURCE_ARIA_LABELS } from '@/constants/source';
import { metrics } from '@/lib/observability/metrics';
import { addBreadcrumb } from '@/lib/observability/tracing';
import type { Source } from '@/types/api';

/**
 * DeleteSourceDialog Component Props
 */
export interface DeleteSourceDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Source to delete */
  source: Source;
  /** Optional callback when source is successfully deleted */
  onSuccess?: () => void;
}

/**
 * DeleteSourceDialog Component
 *
 * A dialog for confirming deletion of an RSS/Atom feed source.
 * Displays a confirmation message and handles the delete mutation.
 *
 * Features:
 * - Shows source name in confirmation message
 * - Displays error messages when deletion fails
 * - Optimistic updates with rollback on error
 * - Automatic cache invalidation on success
 * - Focus management (focus moves to dialog on open, returns to trigger on close)
 * - Accessible dialog with ARIA labels
 * - Observability: metrics tracking for dialog interactions
 *
 * @example
 * ```tsx
 * function SourceCard({ source }: { source: Source }) {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setIsOpen(true)}>Delete</Button>
 *       <DeleteSourceDialog
 *         isOpen={isOpen}
 *         onClose={() => setIsOpen(false)}
 *         source={source}
 *         onSuccess={() => console.log('Source deleted!')}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function DeleteSourceDialog({
  isOpen,
  onClose,
  source,
  onSuccess,
}: DeleteSourceDialogProps) {
  const { mutateAsync, isPending, error, reset } = useDeleteSource();

  // Track dialog open
  React.useEffect(() => {
    if (isOpen) {
      metrics.source.delete.dialog('open', source.id);
      addBreadcrumb('Delete dialog opened', 'ui', 'info', {
        sourceId: source.id,
        sourceName: source.name,
      });
    }
  }, [isOpen, source.id, source.name]);

  /**
   * Handle delete confirmation
   * Performs the delete mutation and closes dialog on success
   */
  const handleDelete = async () => {
    // Track confirm action
    metrics.source.delete.dialog('confirm', source.id);
    addBreadcrumb('Delete confirmed by user', 'ui', 'info', {
      sourceId: source.id,
      sourceName: source.name,
    });

    try {
      await mutateAsync({ id: source.id });
      reset();
      onSuccess?.();
      onClose();
    } catch {
      // Error is handled by the mutation's error state
      // and displayed via the error message below
      // Error tracking is handled in useDeleteSource hook
    }
  };

  /**
   * Handle dialog close
   * Resets mutation state to clear any errors
   */
  const handleClose = () => {
    // Track cancel action
    metrics.source.delete.dialog('cancel', source.id);
    addBreadcrumb('Delete cancelled by user', 'ui', 'info', {
      sourceId: source.id,
    });

    reset();
    onClose();
  };

  /**
   * Handle open change from Dialog
   * Called when dialog is closed via escape key or backdrop click
   */
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent data-testid={SOURCE_TEST_IDS.DELETE_DIALOG}>
        <DialogHeader>
          <DialogTitle>Delete Source</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &apos;{source.name}&apos;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div
            role="alert"
            data-testid={SOURCE_TEST_IDS.DELETE_ERROR}
            className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
          >
            {error.message || 'Failed to delete source. Please try again.'}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isPending}
            data-testid={SOURCE_TEST_IDS.DELETE_CANCEL_BUTTON}
            aria-label={SOURCE_ARIA_LABELS.DELETE_CANCEL_BUTTON}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            data-testid={SOURCE_TEST_IDS.DELETE_CONFIRM_BUTTON}
            aria-label={SOURCE_ARIA_LABELS.DELETE_CONFIRM_BUTTON(source.name)}
          >
            {isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

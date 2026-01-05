'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SourceForm } from './SourceForm';
import { useUpdateSource } from '@/hooks/useUpdateSource';
import { sourceToFormData, formDataToUpdateInput } from '@/utils/sourceTransformers';
import { SOURCE_TEST_IDS } from '@/constants/source';
import type { Source, SourceFormData } from '@/types/api';

/**
 * EditSourceDialog Component Props
 */
export interface EditSourceDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Source to edit */
  source: Source;
  /** Optional callback when source is successfully updated */
  onSuccess?: () => void;
}

/**
 * EditSourceDialog Component
 *
 * A dialog for editing existing RSS/Atom feed sources.
 * Wraps SourceForm with Dialog UI and handles the update mutation.
 *
 * Features:
 * - Pre-populates form with current source data
 * - Optimistic updates with rollback on error
 * - Automatic cache invalidation on success
 * - Focus management (focus moves to dialog on open, returns to trigger on close)
 * - Accessible dialog with ARIA labels
 *
 * @example
 * ```tsx
 * function SourceCard({ source }: { source: Source }) {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setIsOpen(true)}>Edit</Button>
 *       <EditSourceDialog
 *         isOpen={isOpen}
 *         onClose={() => setIsOpen(false)}
 *         source={source}
 *         onSuccess={() => console.log('Source updated!')}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function EditSourceDialog({ isOpen, onClose, source, onSuccess }: EditSourceDialogProps) {
  const { mutateAsync, isPending, error, reset } = useUpdateSource();

  /**
   * Handle form submission
   * Converts form data to API format and performs the update mutation
   */
  const handleSubmit = async (data: SourceFormData) => {
    try {
      const updateInput = formDataToUpdateInput(data, source.active);
      await mutateAsync({ id: source.id, data: updateInput });
      reset();
      onSuccess?.();
      onClose();
    } catch {
      // Error is handled by the mutation's error state
      // and displayed via the error prop in SourceForm
    }
  };

  /**
   * Handle dialog close
   * Resets mutation state to clear any errors
   */
  const handleClose = () => {
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
      <DialogContent data-testid={SOURCE_TEST_IDS.EDIT_DIALOG}>
        <DialogHeader>
          <DialogTitle>Edit Source</DialogTitle>
          <DialogDescription>Edit the source details below.</DialogDescription>
        </DialogHeader>

        <SourceForm
          mode="edit"
          initialData={sourceToFormData(source)}
          onSubmit={handleSubmit}
          isLoading={isPending}
          error={error}
          onCancel={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}

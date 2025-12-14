'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AddSourceForm } from './AddSourceForm';
import { useCreateSource } from '@/hooks/useCreateSource';
import type { CreateSourceInput } from '@/types/api';

/**
 * AddSourceDialog Component Props
 */
interface AddSourceDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when the dialog should close */
  onClose: () => void;
  /** Optional callback when source is successfully created */
  onSuccess?: () => void;
}

/**
 * AddSourceDialog Component
 *
 * A dialog for adding new RSS/Atom feed sources.
 * Wraps AddSourceForm with Dialog UI and handles the create mutation.
 *
 * @example
 * ```tsx
 * function SourcesPage() {
 *   const [isOpen, setIsOpen] = useState(false);
 *
 *   return (
 *     <>
 *       <Button onClick={() => setIsOpen(true)}>Add Source</Button>
 *       <AddSourceDialog
 *         isOpen={isOpen}
 *         onClose={() => setIsOpen(false)}
 *         onSuccess={() => console.log('Source created!')}
 *       />
 *     </>
 *   );
 * }
 * ```
 */
export function AddSourceDialog({ isOpen, onClose, onSuccess }: AddSourceDialogProps) {
  const { mutateAsync, isPending, error, reset } = useCreateSource();

  /**
   * Handle form submission
   */
  const handleSubmit = async (data: CreateSourceInput) => {
    try {
      await mutateAsync(data);
      reset();
      onSuccess?.();
      onClose();
    } catch {
      // Error is handled by the mutation's error state
      // and displayed via the error prop in AddSourceForm
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    reset();
    onClose();
  };

  /**
   * Handle open change from Dialog
   */
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Source</DialogTitle>
          <DialogDescription>Add a new RSS or Atom feed source to track.</DialogDescription>
        </DialogHeader>

        <AddSourceForm
          onSubmit={handleSubmit}
          isLoading={isPending}
          error={error}
          onCancel={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}

import React from 'react';
import { Button } from './button';

export function ConfirmDialog({
  open,
  title = 'Confirm action',
  description = 'Are you sure you want to continue?',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  loading = false
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-brown-900/30 p-4">
      <div className="w-full max-w-md rounded-2xl border border-stone-brown-100 bg-white p-6 shadow-lg">
        <h3 className="text-lg font-bold text-stone-brown-900">{title}</h3>
        <p className="mt-2 text-sm text-silver-500">{description}</p>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {loading ? 'Deleting...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

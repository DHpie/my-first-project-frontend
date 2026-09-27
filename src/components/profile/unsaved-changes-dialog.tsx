'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';

interface UnsavedChangesDialogProps {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

export function UnsavedChangesDialog({
  open,
  onKeepEditing,
  onDiscard,
}: UnsavedChangesDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const keepEditingRef = useRef<HTMLButtonElement>(null);

  // 焦点 trap：对话框打开时聚焦到 "Keep editing" 按钮
  useEffect(() => {
    if (open) {
      keepEditingRef.current?.focus();
    }
  }, [open]);

  // Escape 键关闭
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onKeepEditing();
      }
      // 焦点 trap：Tab 循环在对话框内
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    },
    [onKeepEditing],
  );

  // 点击遮罩层关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onKeepEditing();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-labelledby="unsaved-title"
        aria-describedby="unsaved-description"
        className="w-[360px] rounded-lg bg-popover p-6 shadow-lg"
      >
        <h2 id="unsaved-title" className="text-lg font-semibold text-foreground">
          Discard changes?
        </h2>
        <p
          id="unsaved-description"
          className="mt-2 text-sm text-muted-foreground"
        >
          You have unsaved changes. Are you sure you want to leave this page?
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button
            ref={keepEditingRef}
            variant="outline"
            onClick={onKeepEditing}
          >
            Keep editing
          </Button>
          <Button variant="destructive" onClick={onDiscard}>
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}

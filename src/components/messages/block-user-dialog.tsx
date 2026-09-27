'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  otherUserNickname: string;
  onConfirm: () => Promise<void>;
}

/**
 * Block User 二次确认对话框。
 * 确认后调用屏蔽 API，成功后会话从列表消失。
 */
export default function BlockUserDialog({
  open,
  onOpenChange,
  otherUserNickname,
  onConfirm,
}: BlockUserDialogProps) {
  const [blocking, setBlocking] = useState(false);

  const handleConfirm = async () => {
    setBlocking(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // 失败保持对话框打开
    } finally {
      setBlocking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[360px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg">
            Block {otherUserNickname}?
          </DialogTitle>
          <DialogDescription>
            They will no longer be able to send you messages.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={blocking}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={blocking}
          >
            {blocking ? (
              <>
                <Loader2 className="mr-1 size-3 animate-spin" />
                Blocking...
              </>
            ) : (
              'Block'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

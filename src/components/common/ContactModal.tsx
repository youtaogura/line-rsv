import { Mail, Phone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

export function ContactModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>お問合せ先</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">
              電話番号
            </h3>
            <p className="text-sm flex items-center gap-2 hover:text-blue-800">
              <Phone className="h-4 w-4" />
              <a href="tel:03-1234-5678">03-1234-5678</a>
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-2">
              メールアドレス
            </h3>
            <p className="text-sm flex items-center gap-2 hover:text-blue-800">
              <Mail className="h-4 w-4" />
              <a href="mailto:info@plus-2.jp">info@plus-2.jp</a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import type { Mitarbeiterverwaltung } from '@/types/app';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { IconPencil } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel } from '@/i18n';

interface MitarbeiterverwaltungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Mitarbeiterverwaltung | null;
  onEdit: (record: Mitarbeiterverwaltung) => void;
}

export function MitarbeiterverwaltungViewDialog({ open, onClose, record, onEdit }: MitarbeiterverwaltungViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('mitarbeiterverwaltung') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('mitarbeiterverwaltung', 'mitarbeiter_vorname')}</Label>
            <p className="text-sm">{record.fields.mitarbeiter_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('mitarbeiterverwaltung', 'mitarbeiter_telefon')}</Label>
            <p className="text-sm">{record.fields.mitarbeiter_telefon ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('mitarbeiterverwaltung', 'mitarbeiter_nachname')}</Label>
            <p className="text-sm">{record.fields.mitarbeiter_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('mitarbeiterverwaltung', 'mitarbeiter_email')}</Label>
            <p className="text-sm">{record.fields.mitarbeiter_email ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.MITARBEITERVERWALTUNG} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import type { Schichtartenverwaltung } from '@/types/app';
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

interface SchichtartenverwaltungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schichtartenverwaltung | null;
  onEdit: (record: Schichtartenverwaltung) => void;
}

export function SchichtartenverwaltungViewDialog({ open, onClose, record, onEdit }: SchichtartenverwaltungViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('schichtartenverwaltung') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichtartenverwaltung', 'schichtart_name')}</Label>
            <p className="text-sm">{record.fields.schichtart_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichtartenverwaltung', 'schichtart_beschreibung')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.schichtart_beschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichtartenverwaltung', 'schichtart_ende')}</Label>
            <p className="text-sm">{record.fields.schichtart_ende ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichtartenverwaltung', 'schichtart_beginn')}</Label>
            <p className="text-sm">{record.fields.schichtart_beginn ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.SCHICHTARTENVERWALTUNG} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
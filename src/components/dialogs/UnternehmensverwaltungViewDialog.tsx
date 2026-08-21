import type { Unternehmensverwaltung } from '@/types/app';
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

interface UnternehmensverwaltungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Unternehmensverwaltung | null;
  onEdit: (record: Unternehmensverwaltung) => void;
}

export function UnternehmensverwaltungViewDialog({ open, onClose, record, onEdit }: UnternehmensverwaltungViewDialogProps) {
  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('unternehmensverwaltung') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('unternehmensverwaltung', 'unternehmen_name')}</Label>
            <p className="text-sm">{record.fields.unternehmen_name ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('unternehmensverwaltung', 'unternehmen_plz')}</Label>
            <p className="text-sm">{record.fields.unternehmen_plz ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('unternehmensverwaltung', 'unternehmen_notiz')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.unternehmen_notiz ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('unternehmensverwaltung', 'unternehmen_ort')}</Label>
            <p className="text-sm">{record.fields.unternehmen_ort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('unternehmensverwaltung', 'unternehmen_strasse')}</Label>
            <p className="text-sm">{record.fields.unternehmen_strasse ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('unternehmensverwaltung', 'unternehmen_hausnummer')}</Label>
            <p className="text-sm">{record.fields.unternehmen_hausnummer ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.UNTERNEHMENSVERWALTUNG} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
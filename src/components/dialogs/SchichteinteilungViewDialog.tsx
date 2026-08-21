import type { Schichteinteilung, Unternehmensverwaltung, Schichtartenverwaltung, Mitarbeiterverwaltung } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { IconPencil } from '@tabler/icons-react';
import { t, appLabel, fieldLabel, lookupLabel, dateFnsLocale, dateFormat } from '@/i18n';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), dateFormat(), { locale: dateFnsLocale() }); } catch { return d; }
}

interface SchichteinteilungViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Schichteinteilung | null;
  onEdit: (record: Schichteinteilung) => void;
  unternehmensverwaltungList: Unternehmensverwaltung[];
  schichtartenverwaltungList: Schichtartenverwaltung[];
  mitarbeiterverwaltungList: Mitarbeiterverwaltung[];
}

export function SchichteinteilungViewDialog({ open, onClose, record, onEdit, unternehmensverwaltungList, schichtartenverwaltungList, mitarbeiterverwaltungList }: SchichteinteilungViewDialogProps) {
  function getUnternehmensverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return unternehmensverwaltungList.find(r => r.record_id === id)?.fields.unternehmen_name ?? '—';
  }

  function getSchichtartenverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return schichtartenverwaltungList.find(r => r.record_id === id)?.fields.schichtart_name ?? '—';
  }

  function getMitarbeiterverwaltungDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return mitarbeiterverwaltungList.find(r => r.record_id === id)?.fields.mitarbeiter_vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('view_entity', { entity: appLabel('schichteinteilung') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichteinteilung', 'zuweisung_notiz')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.zuweisung_notiz ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichteinteilung', 'zuweisung_ende')}</Label>
            <p className="text-sm">{record.fields.zuweisung_ende ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichteinteilung', 'zuweisung_datum')}</Label>
            <p className="text-sm">{formatDate(record.fields.zuweisung_datum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichteinteilung', 'zuweisung_unternehmen')}</Label>
            <p className="text-sm">{getUnternehmensverwaltungDisplayName(record.fields.zuweisung_unternehmen)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichteinteilung', 'zuweisung_schichtart')}</Label>
            <p className="text-sm">{getSchichtartenverwaltungDisplayName(record.fields.zuweisung_schichtart)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichteinteilung', 'zuweisung_beginn')}</Label>
            <p className="text-sm">{record.fields.zuweisung_beginn ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('schichteinteilung', 'zuweisung_mitarbeiter')}</Label>
            <p className="text-sm">{getMitarbeiterverwaltungDisplayName(record.fields.zuweisung_mitarbeiter)}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.SCHICHTEINTEILUNG} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
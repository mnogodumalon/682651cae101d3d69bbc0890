import { useState, useEffect, useRef } from 'react';
import type { Schichteinteilung, Mitarbeiterverwaltung, Unternehmensverwaltung, Schichtartenverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Camera, Loader2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';

interface SchichteinteilungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Schichteinteilung['fields']) => Promise<void>;
  defaultValues?: Schichteinteilung['fields'];
  mitarbeiterverwaltungList: Mitarbeiterverwaltung[];
  unternehmensverwaltungList: Unternehmensverwaltung[];
  schichtartenverwaltungList: Schichtartenverwaltung[];
  enablePhotoScan?: boolean;
}

export function SchichteinteilungDialog({ open, onClose, onSubmit, defaultValues, mitarbeiterverwaltungList, unternehmensverwaltungList, schichtartenverwaltungList, enablePhotoScan = false }: SchichteinteilungDialogProps) {
  const [fields, setFields] = useState<Partial<Schichteinteilung['fields']>>({});
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setFields(defaultValues ?? {});
  }, [open, defaultValues]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(fields as Schichteinteilung['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "zuweisung_notiz": string | null, // Notiz (optional)\n  "zuweisung_beginn": string | null, // Beginn (Uhrzeit)\n  "zuweisung_ende": string | null, // Ende (Uhrzeit)\n  "zuweisung_mitarbeiter": string | null, // Name des Mitarbeiterverwaltung-Eintrags (z.B. "Jonas Schmidt")\n  "zuweisung_datum": string | null, // YYYY-MM-DD // Datum der Schicht\n  "zuweisung_unternehmen": string | null, // Name des Unternehmensverwaltung-Eintrags (z.B. "Jonas Schmidt")\n  "zuweisung_schichtart": string | null, // Name des Schichtartenverwaltung-Eintrags (z.B. "Jonas Schmidt")\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["zuweisung_mitarbeiter", "zuweisung_unternehmen", "zuweisung_schichtart"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        const zuweisung_mitarbeiterName = raw['zuweisung_mitarbeiter'] as string | null;
        if (zuweisung_mitarbeiterName && !merged['zuweisung_mitarbeiter']) {
          const zuweisung_mitarbeiterMatch = mitarbeiterverwaltungList.find(r => matchName(zuweisung_mitarbeiterName!, [String(r.fields.mitarbeiter_vorname ?? '')]));
          if (zuweisung_mitarbeiterMatch) merged['zuweisung_mitarbeiter'] = createRecordUrl(APP_IDS.MITARBEITERVERWALTUNG, zuweisung_mitarbeiterMatch.record_id);
        }
        const zuweisung_unternehmenName = raw['zuweisung_unternehmen'] as string | null;
        if (zuweisung_unternehmenName && !merged['zuweisung_unternehmen']) {
          const zuweisung_unternehmenMatch = unternehmensverwaltungList.find(r => matchName(zuweisung_unternehmenName!, [String(r.fields.unternehmen_name ?? '')]));
          if (zuweisung_unternehmenMatch) merged['zuweisung_unternehmen'] = createRecordUrl(APP_IDS.UNTERNEHMENSVERWALTUNG, zuweisung_unternehmenMatch.record_id);
        }
        const zuweisung_schichtartName = raw['zuweisung_schichtart'] as string | null;
        if (zuweisung_schichtartName && !merged['zuweisung_schichtart']) {
          const zuweisung_schichtartMatch = schichtartenverwaltungList.find(r => matchName(zuweisung_schichtartName!, [String(r.fields.schichtart_name ?? '')]));
          if (zuweisung_schichtartMatch) merged['zuweisung_schichtart'] = createRecordUrl(APP_IDS.SCHICHTARTENVERWALTUNG, zuweisung_schichtartMatch.record_id);
        }
        return merged as Partial<Schichteinteilung['fields']>;
      });
    } catch (err) {
      console.error('Scan fehlgeschlagen:', err);
    } finally {
      setScanning(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{defaultValues ? 'Schichteinteilung bearbeiten' : 'Schichteinteilung hinzufügen'}</DialogTitle>
            {enablePhotoScan && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handlePhotoScan(f);
                    e.target.value = '';
                  }}
                />
                <Button type="button" variant="outline" size="sm" disabled={scanning} onClick={() => fileInputRef.current?.click()}>
                  {scanning ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Camera className="h-4 w-4 mr-1" />}
                  {scanning ? 'Wird erkannt...' : 'Foto scannen'}
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zuweisung_notiz">Notiz (optional)</Label>
            <Textarea
              id="zuweisung_notiz"
              value={fields.zuweisung_notiz ?? ''}
              onChange={e => setFields(f => ({ ...f, zuweisung_notiz: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zuweisung_beginn">Beginn (Uhrzeit)</Label>
            <Input
              id="zuweisung_beginn"
              value={fields.zuweisung_beginn ?? ''}
              onChange={e => setFields(f => ({ ...f, zuweisung_beginn: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zuweisung_ende">Ende (Uhrzeit)</Label>
            <Input
              id="zuweisung_ende"
              value={fields.zuweisung_ende ?? ''}
              onChange={e => setFields(f => ({ ...f, zuweisung_ende: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zuweisung_mitarbeiter">Mitarbeiter auswählen</Label>
            <Select
              value={extractRecordId(fields.zuweisung_mitarbeiter) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, zuweisung_mitarbeiter: v === 'none' ? undefined : createRecordUrl(APP_IDS.MITARBEITERVERWALTUNG, v) }))}
            >
              <SelectTrigger id="zuweisung_mitarbeiter"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {mitarbeiterverwaltungList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.mitarbeiter_vorname ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zuweisung_datum">Datum der Schicht</Label>
            <Input
              id="zuweisung_datum"
              type="date"
              value={fields.zuweisung_datum ?? ''}
              onChange={e => setFields(f => ({ ...f, zuweisung_datum: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zuweisung_unternehmen">Unternehmen auswählen</Label>
            <Select
              value={extractRecordId(fields.zuweisung_unternehmen) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, zuweisung_unternehmen: v === 'none' ? undefined : createRecordUrl(APP_IDS.UNTERNEHMENSVERWALTUNG, v) }))}
            >
              <SelectTrigger id="zuweisung_unternehmen"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {unternehmensverwaltungList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.unternehmen_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="zuweisung_schichtart">Schichtart auswählen</Label>
            <Select
              value={extractRecordId(fields.zuweisung_schichtart) ?? 'none'}
              onValueChange={v => setFields(f => ({ ...f, zuweisung_schichtart: v === 'none' ? undefined : createRecordUrl(APP_IDS.SCHICHTARTENVERWALTUNG, v) }))}
            >
              <SelectTrigger id="zuweisung_schichtart"><SelectValue placeholder="Auswählen..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">—</SelectItem>
                {schichtartenverwaltungList.map(r => (
                  <SelectItem key={r.record_id} value={r.record_id}>
                    {r.fields.schichtart_name ?? r.record_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Speichern...' : defaultValues ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
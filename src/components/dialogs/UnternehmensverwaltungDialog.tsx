import { useState, useEffect, useRef } from 'react';
import type { Unternehmensverwaltung } from '@/types/app';
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
import { Camera, Loader2 } from 'lucide-react';
import { extractFromPhoto, fileToDataUri } from '@/lib/ai';

interface UnternehmensverwaltungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Unternehmensverwaltung['fields']) => Promise<void>;
  defaultValues?: Unternehmensverwaltung['fields'];
  enablePhotoScan?: boolean;
}

export function UnternehmensverwaltungDialog({ open, onClose, onSubmit, defaultValues, enablePhotoScan = false }: UnternehmensverwaltungDialogProps) {
  const [fields, setFields] = useState<Partial<Unternehmensverwaltung['fields']>>({});
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
      await onSubmit(fields as Unternehmensverwaltung['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "unternehmen_name": string | null, // Name des Unternehmens\n  "unternehmen_strasse": string | null, // Straße\n  "unternehmen_hausnummer": string | null, // Hausnummer\n  "unternehmen_plz": string | null, // Postleitzahl\n  "unternehmen_ort": string | null, // Ort\n  "unternehmen_notiz": string | null, // Notiz (optional)\n}`;
      const raw = await extractFromPhoto<Record<string, unknown>>(uri, schema);
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        for (const [k, v] of Object.entries(raw)) {
          if (v != null && (merged[k] == null || merged[k] === '')) merged[k] = v;
        }
        return merged as Partial<Unternehmensverwaltung['fields']>;
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
            <DialogTitle>{defaultValues ? 'Unternehmensverwaltung bearbeiten' : 'Unternehmensverwaltung hinzufügen'}</DialogTitle>
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
            <Label htmlFor="unternehmen_name">Name des Unternehmens</Label>
            <Input
              id="unternehmen_name"
              value={fields.unternehmen_name ?? ''}
              onChange={e => setFields(f => ({ ...f, unternehmen_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unternehmen_strasse">Straße</Label>
            <Input
              id="unternehmen_strasse"
              value={fields.unternehmen_strasse ?? ''}
              onChange={e => setFields(f => ({ ...f, unternehmen_strasse: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unternehmen_hausnummer">Hausnummer</Label>
            <Input
              id="unternehmen_hausnummer"
              value={fields.unternehmen_hausnummer ?? ''}
              onChange={e => setFields(f => ({ ...f, unternehmen_hausnummer: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unternehmen_plz">Postleitzahl</Label>
            <Input
              id="unternehmen_plz"
              value={fields.unternehmen_plz ?? ''}
              onChange={e => setFields(f => ({ ...f, unternehmen_plz: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unternehmen_ort">Ort</Label>
            <Input
              id="unternehmen_ort"
              value={fields.unternehmen_ort ?? ''}
              onChange={e => setFields(f => ({ ...f, unternehmen_ort: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unternehmen_notiz">Notiz (optional)</Label>
            <Textarea
              id="unternehmen_notiz"
              value={fields.unternehmen_notiz ?? ''}
              onChange={e => setFields(f => ({ ...f, unternehmen_notiz: e.target.value }))}
              rows={3}
            />
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
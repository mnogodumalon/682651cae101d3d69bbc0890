import { useState, useEffect, useRef } from 'react';
import type { Schichtartenverwaltung } from '@/types/app';
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

interface SchichtartenverwaltungDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Schichtartenverwaltung['fields']) => Promise<void>;
  defaultValues?: Schichtartenverwaltung['fields'];
  enablePhotoScan?: boolean;
}

export function SchichtartenverwaltungDialog({ open, onClose, onSubmit, defaultValues, enablePhotoScan = false }: SchichtartenverwaltungDialogProps) {
  const [fields, setFields] = useState<Partial<Schichtartenverwaltung['fields']>>({});
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
      await onSubmit(fields as Schichtartenverwaltung['fields']);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoScan(file: File) {
    setScanning(true);
    try {
      const uri = await fileToDataUri(file);
      const schema = `{\n  "schichtart_name": string | null, // Name der Schichtart\n  "schichtart_beschreibung": string | null, // Beschreibung\n  "schichtart_beginn": string | null, // Beginn (Uhrzeit)\n  "schichtart_ende": string | null, // Ende (Uhrzeit)\n}`;
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
        return merged as Partial<Schichtartenverwaltung['fields']>;
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
            <DialogTitle>{defaultValues ? 'Schichtartenverwaltung bearbeiten' : 'Schichtartenverwaltung hinzufügen'}</DialogTitle>
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
            <Label htmlFor="schichtart_name">Name der Schichtart</Label>
            <Input
              id="schichtart_name"
              value={fields.schichtart_name ?? ''}
              onChange={e => setFields(f => ({ ...f, schichtart_name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schichtart_beschreibung">Beschreibung</Label>
            <Textarea
              id="schichtart_beschreibung"
              value={fields.schichtart_beschreibung ?? ''}
              onChange={e => setFields(f => ({ ...f, schichtart_beschreibung: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schichtart_beginn">Beginn (Uhrzeit)</Label>
            <Input
              id="schichtart_beginn"
              value={fields.schichtart_beginn ?? ''}
              onChange={e => setFields(f => ({ ...f, schichtart_beginn: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schichtart_ende">Ende (Uhrzeit)</Label>
            <Input
              id="schichtart_ende"
              value={fields.schichtart_ende ?? ''}
              onChange={e => setFields(f => ({ ...f, schichtart_ende: e.target.value }))}
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
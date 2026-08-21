import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import type { Schichteinteilung, Unternehmensverwaltung, Schichtartenverwaltung, Mitarbeiterverwaltung } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table';
import { IconPencil, IconTrash, IconPlus, IconSearch, IconArrowsUpDown, IconArrowUp, IconArrowDown } from '@tabler/icons-react';
import { SchichteinteilungDialog } from '@/components/dialogs/SchichteinteilungDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageShell } from '@/components/PageShell';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel, fieldLabel, lookupLabel, dateFnsLocale, dateFormat } from '@/i18n';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), dateFormat(), { locale: dateFnsLocale() }); } catch { return d; }
}

export default function SchichteinteilungPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<Schichteinteilung[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Schichteinteilung | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schichteinteilung | null>(null);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [unternehmensverwaltungList, setUnternehmensverwaltungList] = useState<Unternehmensverwaltung[]>([]);
  const [schichtartenverwaltungList, setSchichtartenverwaltungList] = useState<Schichtartenverwaltung[]>([]);
  const [mitarbeiterverwaltungList, setMitarbeiterverwaltungList] = useState<Mitarbeiterverwaltung[]>([]);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, unternehmensverwaltungData, schichtartenverwaltungData, mitarbeiterverwaltungData] = await Promise.all([
        LivingAppsService.getSchichteinteilung(),
        LivingAppsService.getUnternehmensverwaltung(),
        LivingAppsService.getSchichtartenverwaltung(),
        LivingAppsService.getMitarbeiterverwaltung(),
      ]);
      setRecords(mainData);
      setUnternehmensverwaltungList(unternehmensverwaltungData);
      setSchichtartenverwaltungList(schichtartenverwaltungData);
      setMitarbeiterverwaltungList(mitarbeiterverwaltungData);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(fields: Schichteinteilung['fields']) {
    await LivingAppsService.createSchichteinteilungEntry(fields);
    await loadData();
    setDialogOpen(false);
  }

  async function handleUpdate(fields: Schichteinteilung['fields']) {
    if (!editingRecord) return;
    await LivingAppsService.updateSchichteinteilungEntry(editingRecord.record_id, fields);
    await loadData();
    setEditingRecord(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await LivingAppsService.deleteSchichteinteilungEntry(deleteTarget.record_id);
    setRecords(prev => prev.filter(r => r.record_id !== deleteTarget.record_id));
    setDeleteTarget(null);
  }

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

  const filtered = records.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return Object.values(r.fields).some(v => {
      if (v == null) return false;
      if (Array.isArray(v)) return v.some(item => typeof item === 'object' && item !== null && 'label' in item ? String((item as any).label).toLowerCase().includes(s) : String(item).toLowerCase().includes(s));
      if (typeof v === 'object' && 'label' in (v as any)) return String((v as any).label).toLowerCase().includes(s);
      return String(v).toLowerCase().includes(s);
    });
  });

  function toggleSort(key: string) {
    if (sortKey === key) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortKey(''); setSortDir('asc'); }
    } else { setSortKey(key); setSortDir('asc'); }
  }

  function sortRecords<T extends { fields: Record<string, any> }>(recs: T[]): T[] {
    if (!sortKey) return recs;
    return [...recs].sort((a, b) => {
      let va: any = a.fields[sortKey], vb: any = b.fields[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (typeof va === 'object' && 'label' in va) va = va.label;
      if (typeof vb === 'object' && 'label' in vb) vb = vb.label;
      if (typeof va === 'number' && typeof vb === 'number') return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va));
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <PageShell
      title={appLabel('schichteinteilung')}
      subtitle={`${records.length} ${t('in_system', { entity: appLabel('schichteinteilung') })}`}
      action={
        <Button onClick={() => setDialogOpen(true)} className="shrink-0 rounded-full shadow-sm">
          <IconPlus className="h-4 w-4 mr-2" /> {t('add')}
        </Button>
      }
    >
      <div className="relative w-full max-w-sm">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('search_entity', { entity: appLabel('schichteinteilung') })}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="rounded-[27px] bg-card shadow-lg overflow-hidden">
        <Table className="[&_tbody_td]:px-6 [&_tbody_td]:py-2 [&_tbody_td]:text-base [&_tbody_td]:font-medium [&_tbody_tr:first-child_td]:pt-6 [&_tbody_tr:last-child_td]:pb-10">
          <TableHeader className="bg-secondary">
            <TableRow className="border-b border-input">
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('zuweisung_notiz')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('schichteinteilung', 'zuweisung_notiz')}
                  {sortKey === 'zuweisung_notiz' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('zuweisung_ende')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('schichteinteilung', 'zuweisung_ende')}
                  {sortKey === 'zuweisung_ende' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('zuweisung_datum')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('schichteinteilung', 'zuweisung_datum')}
                  {sortKey === 'zuweisung_datum' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('zuweisung_unternehmen')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('schichteinteilung', 'zuweisung_unternehmen')}
                  {sortKey === 'zuweisung_unternehmen' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('zuweisung_schichtart')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('schichteinteilung', 'zuweisung_schichtart')}
                  {sortKey === 'zuweisung_schichtart' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('zuweisung_beginn')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('schichteinteilung', 'zuweisung_beginn')}
                  {sortKey === 'zuweisung_beginn' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6 cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort('zuweisung_mitarbeiter')}>
                <span className="inline-flex items-center gap-1">
                  {fieldLabel('schichteinteilung', 'zuweisung_mitarbeiter')}
                  {sortKey === 'zuweisung_mitarbeiter' ? (sortDir === 'asc' ? <IconArrowUp size={14} /> : <IconArrowDown size={14} />) : <IconArrowsUpDown size={14} className="opacity-30" />}
                </span>
              </TableHead>
              <TableHead className="w-24 uppercase text-xs font-semibold text-secondary-foreground tracking-wider px-6">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortRecords(filtered).map(record => (
              <TableRow key={record.record_id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={(e) => { if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return; navigate(`/schichteinteilung/${record.record_id}`); }}>
                <TableCell className="max-w-xs"><span className="truncate block">{record.fields.zuweisung_notiz ?? '—'}</span></TableCell>
                <TableCell className="font-medium">{record.fields.zuweisung_ende ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(record.fields.zuweisung_datum)}</TableCell>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getUnternehmensverwaltungDisplayName(record.fields.zuweisung_unternehmen)}</span></TableCell>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getSchichtartenverwaltungDisplayName(record.fields.zuweisung_schichtart)}</span></TableCell>
                <TableCell>{record.fields.zuweisung_beginn ?? '—'}</TableCell>
                <TableCell><span className="inline-flex items-center bg-secondary border border-[#bfdbfe] text-[#2563eb] rounded-[10px] px-2 py-1 text-sm font-medium">{getMitarbeiterverwaltungDisplayName(record.fields.zuweisung_mitarbeiter)}</span></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingRecord(record)}>
                      <IconPencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(record)}>
                      <IconTrash className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-16 text-muted-foreground">
                  {search ? t('no_results') : t('no_data_yet', { entity: appLabel('schichteinteilung') })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <SchichteinteilungDialog
        open={dialogOpen || !!editingRecord}
        onClose={() => { setDialogOpen(false); setEditingRecord(null); }}
        onSubmit={editingRecord ? handleUpdate : handleCreate}
        defaultValues={editingRecord?.fields}
        recordId={editingRecord?.record_id}
        unternehmensverwaltungList={unternehmensverwaltungList}
        schichtartenverwaltungList={schichtartenverwaltungList}
        mitarbeiterverwaltungList={mitarbeiterverwaltungList}
        enablePhotoScan={AI_PHOTO_SCAN['Schichteinteilung']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Schichteinteilung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('delete_entity', { entity: appLabel('schichteinteilung') })}
        description={t('confirm_delete_desc')}
      />

    </PageShell>
  );
}
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichSchichteinteilung } from '@/lib/enrich';
import type { EnrichedSchichteinteilung } from '@/types/enriched';
import type { Schichteinteilung } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SchichteinteilungDialog } from '@/components/dialogs/SchichteinteilungDialog';
import { AI_PHOTO_SCAN } from '@/config/ai-features';
import {
  AlertCircle, Plus, ChevronLeft, ChevronRight, Users, Building2, Clock, CalendarDays, Pencil, Trash2
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, isSameDay, parseISO, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DashboardOverview() {
  const {
    unternehmensverwaltung, schichtartenverwaltung, schichteinteilung, mitarbeiterverwaltung,
    unternehmensverwaltungMap, schichtartenverwaltungMap, mitarbeiterverwaltungMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const enrichedSchichteinteilung = enrichSchichteinteilung(schichteinteilung, {
    mitarbeiterverwaltungMap, unternehmensverwaltungMap, schichtartenverwaltungMap
  });

  const [weekOffset, setWeekOffset] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<EnrichedSchichteinteilung | null>(null);
  const [prefillDate, setPrefillDate] = useState<string | undefined>(undefined);
  const [deleteTarget, setDeleteTarget] = useState<EnrichedSchichteinteilung | null>(null);

  const weekStart = useMemo(() => {
    const base = startOfWeek(new Date(), { weekStartsOn: 1 });
    return addDays(base, weekOffset * 7);
  }, [weekOffset]);

  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);

  const shiftsForDay = (day: Date) =>
    enrichedSchichteinteilung.filter(s => {
      if (!s.fields.zuweisung_datum) return false;
      try { return isSameDay(parseISO(s.fields.zuweisung_datum), day); } catch { return false; }
    });

  const todayShifts = enrichedSchichteinteilung.filter(s => {
    if (!s.fields.zuweisung_datum) return false;
    try { return isToday(parseISO(s.fields.zuweisung_datum)); } catch { return false; }
  });

  const openCreate = (date?: string) => {
    setEditRecord(null);
    setPrefillDate(date);
    setDialogOpen(true);
  };

  const openEdit = (s: EnrichedSchichteinteilung) => {
    setEditRecord(s);
    setPrefillDate(undefined);
    setDialogOpen(true);
  };

  const handleSubmit = async (fields: Schichteinteilung['fields']) => {
    if (editRecord) {
      await LivingAppsService.updateSchichteinteilungEntry(editRecord.record_id, fields);
    } else {
      await LivingAppsService.createSchichteinteilungEntry(fields);
    }
    fetchAll();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await LivingAppsService.deleteSchichteinteilungEntry(deleteTarget.record_id);
    setDeleteTarget(null);
    fetchAll();
  };

  const defaultValues = useMemo(() => {
    if (editRecord) return editRecord.fields;
    if (prefillDate) return { zuweisung_datum: prefillDate };
    return undefined;
  }, [editRecord, prefillDate]);

  const weekLabel = `${format(weekStart, 'dd.MM', { locale: de })} – ${format(addDays(weekStart, 6), 'dd.MM.yyyy', { locale: de })}`;

  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Schichtplan</h1>
          <p className="text-sm text-muted-foreground">Wochenübersicht · {weekLabel}</p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2 shrink-0">
          <Plus size={16} /> Schicht hinzufügen
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Mitarbeiter"
          value={String(mitarbeiterverwaltung.length)}
          description="Gesamt"
          icon={<Users size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Unternehmen"
          value={String(unternehmensverwaltung.length)}
          description="Gesamt"
          icon={<Building2 size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Schichtarten"
          value={String(schichtartenverwaltung.length)}
          description="Definiert"
          icon={<Clock size={18} className="text-muted-foreground" />}
        />
        <StatCard
          title="Heute"
          value={String(todayShifts.length)}
          description="Schichten"
          icon={<CalendarDays size={18} className="text-muted-foreground" />}
        />
      </div>

      {/* Weekly Calendar */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Week Navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <button
            onClick={() => setWeekOffset(o => o - 1)}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-foreground">{weekLabel}</span>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-primary hover:underline"
              >
                Heute
              </button>
            )}
          </div>
          <button
            onClick={() => setWeekOffset(o => o + 1)}
            className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Day Columns — desktop */}
        <div className="hidden md:grid md:grid-cols-7 divide-x divide-border min-h-[420px]">
          {weekDays.map(day => {
            const dayShifts = shiftsForDay(day);
            const today = isToday(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            return (
              <div key={dateStr} className={`flex flex-col ${today ? 'bg-primary/5' : ''}`}>
                {/* Day Header */}
                <div className={`px-2 py-2 border-b border-border text-center ${today ? 'bg-primary/10' : 'bg-muted/20'}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {format(day, 'EEE', { locale: de })}
                  </p>
                  <p className={`text-lg font-bold leading-tight ${today ? 'text-primary' : 'text-foreground'}`}>
                    {format(day, 'd')}
                  </p>
                </div>

                {/* Shift Cards */}
                <div className="flex-1 p-1.5 space-y-1.5 overflow-y-auto max-h-72">
                  {dayShifts.map(s => (
                    <ShiftCard
                      key={s.record_id}
                      shift={s}
                      onEdit={() => openEdit(s)}
                      onDelete={() => setDeleteTarget(s)}
                    />
                  ))}
                  {dayShifts.length === 0 && (
                    <div className="flex items-center justify-center h-full opacity-0 hover:opacity-100 transition-opacity pt-6">
                      <span className="text-xs text-muted-foreground">Leer</span>
                    </div>
                  )}
                </div>

                {/* Add Button */}
                <div className="p-1.5 border-t border-border/50">
                  <button
                    onClick={() => openCreate(dateStr)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus size={12} /> Hinzufügen
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile: vertical day list */}
        <div className="md:hidden divide-y divide-border">
          {weekDays.map(day => {
            const dayShifts = shiftsForDay(day);
            const today = isToday(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            return (
              <div key={dateStr} className={`p-3 ${today ? 'bg-primary/5' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${today ? 'text-primary' : 'text-foreground'}`}>
                      {format(day, 'EEEE, d. MMM', { locale: de })}
                    </span>
                    {today && <Badge variant="outline" className="text-xs border-primary text-primary">Heute</Badge>}
                  </div>
                  <button
                    onClick={() => openCreate(dateStr)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border border-border"
                  >
                    <Plus size={11} /> Schicht
                  </button>
                </div>
                {dayShifts.length > 0 ? (
                  <div className="space-y-1.5">
                    {dayShifts.map(s => (
                      <ShiftCard
                        key={s.record_id}
                        shift={s}
                        onEdit={() => openEdit(s)}
                        onDelete={() => setDeleteTarget(s)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/60 italic">Keine Schichten</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Dialogs */}
      <SchichteinteilungDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditRecord(null); setPrefillDate(undefined); }}
        onSubmit={handleSubmit}
        defaultValues={defaultValues}
        mitarbeiterverwaltungList={mitarbeiterverwaltung}
        unternehmensverwaltungList={unternehmensverwaltung}
        schichtartenverwaltungList={schichtartenverwaltung}
        enablePhotoScan={AI_PHOTO_SCAN['Schichteinteilung']}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Schicht löschen"
        description={`Schicht von ${deleteTarget?.zuweisung_mitarbeiterName || '—'} am ${deleteTarget?.fields.zuweisung_datum ? formatDate(deleteTarget.fields.zuweisung_datum) : '—'} wirklich löschen?`}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function ShiftCard({
  shift,
  onEdit,
  onDelete,
}: {
  shift: EnrichedSchichteinteilung;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const colorClass = shiftColor(shift.zuweisung_schichtartName);

  return (
    <div
      className={`relative rounded-lg px-2 py-1.5 text-xs cursor-pointer group ${colorClass} transition-all`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onEdit}
    >
      {/* Actions */}
      <div className={`absolute top-1 right-1 flex gap-0.5 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="p-0.5 rounded hover:bg-black/10 transition-colors"
        >
          <Pencil size={10} />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-0.5 rounded hover:bg-black/10 transition-colors"
        >
          <Trash2 size={10} />
        </button>
      </div>

      <p className="font-semibold truncate pr-8 leading-tight">
        {shift.zuweisung_mitarbeiterName || '—'}
      </p>
      {shift.zuweisung_schichtartName && (
        <p className="opacity-80 truncate">{shift.zuweisung_schichtartName}</p>
      )}
      {(shift.fields.zuweisung_beginn || shift.fields.zuweisung_ende) && (
        <p className="opacity-70">
          {shift.fields.zuweisung_beginn || '?'} – {shift.fields.zuweisung_ende || '?'}
        </p>
      )}
      {shift.zuweisung_unternehmenName && (
        <p className="opacity-60 truncate text-[10px]">{shift.zuweisung_unternehmenName}</p>
      )}
    </div>
  );
}

// Deterministic color from shift type name
function shiftColor(name: string): string {
  const palette = [
    'bg-indigo-100 text-indigo-800 border border-indigo-200',
    'bg-violet-100 text-violet-800 border border-violet-200',
    'bg-sky-100 text-sky-800 border border-sky-200',
    'bg-emerald-100 text-emerald-800 border border-emerald-200',
    'bg-amber-100 text-amber-800 border border-amber-200',
    'bg-rose-100 text-rose-800 border border-rose-200',
  ];
  if (!name) return palette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) & 0xffffffff;
  return palette[Math.abs(hash) % palette.length];
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}

function DashboardError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle size={22} className="text-destructive" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground mb-1">Fehler beim Laden</h3>
        <p className="text-sm text-muted-foreground max-w-xs">{error.message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>Erneut versuchen</Button>
    </div>
  );
}

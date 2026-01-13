import { useState, useEffect, useMemo } from 'react';
import type { Schichteinteilung, Mitarbeiterverwaltung, Schichtartenverwaltung, Unternehmensverwaltung } from '@/types/app';
import { LivingAppsService, extractRecordId, createRecordUrl } from '@/services/livingAppsService';
import { APP_IDS } from '@/types/app';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { format, parseISO, addDays, startOfWeek, endOfWeek, isToday, isTomorrow } from 'date-fns';
import { de } from 'date-fns/locale';
import { Plus, ChevronLeft, ChevronRight, Calendar, Users, Clock, AlertCircle, X, Pencil, Trash2 } from 'lucide-react';

// Types for enriched data
interface EnrichedShift extends Schichteinteilung {
  employee?: Mitarbeiterverwaltung;
  shiftType?: Schichtartenverwaltung;
  company?: Unternehmensverwaltung;
}

// Helper to get initials
function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0)?.toUpperCase() || '';
  const l = lastName?.charAt(0)?.toUpperCase() || '';
  return f + l || '??';
}

// Helper to parse time string to minutes for positioning
function timeToMinutes(time?: string): number {
  if (!time) return 0;
  const parts = time.split(':');
  return parseInt(parts[0]) * 60 + parseInt(parts[1] || '0');
}

// Color palette for shift types
const SHIFT_COLORS = [
  { bg: 'hsl(215 70% 55%)', text: 'white' },    // Blue
  { bg: 'hsl(25 95% 53%)', text: 'white' },     // Orange
  { bg: 'hsl(150 60% 40%)', text: 'white' },    // Green
  { bg: 'hsl(280 60% 55%)', text: 'white' },    // Purple
  { bg: 'hsl(45 90% 50%)', text: 'hsl(220 25% 10%)' }, // Yellow
];

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        {/* Stats skeleton */}
        <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0">
          <Skeleton className="h-8 w-32 rounded-full shrink-0" />
          <Skeleton className="h-8 w-28 rounded-full shrink-0" />
          <Skeleton className="h-8 w-24 rounded-full shrink-0" />
        </div>

        {/* Main content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </CardContent>
          </Card>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty state component
function EmptyState({ onAddShift }: { onAddShift: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Keine Schichten heute</h3>
      <p className="text-muted-foreground mb-6 max-w-sm">
        Es sind noch keine Schichten für heute geplant. Weisen Sie jetzt Mitarbeiter zu.
      </p>
      <Button onClick={onAddShift}>
        <Plus className="w-4 h-4 mr-2" />
        Schicht zuweisen
      </Button>
    </div>
  );
}

// Shift card for mobile view
function ShiftCard({
  shift,
  colorIndex,
  isActive,
  onClick
}: {
  shift: EnrichedShift;
  colorIndex: number;
  isActive: boolean;
  onClick: () => void;
}) {
  const color = SHIFT_COLORS[colorIndex % SHIFT_COLORS.length];
  const employee = shift.employee;
  const shiftType = shift.shiftType;

  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl bg-card border cursor-pointer transition-all hover:shadow-md ${
        isActive ? 'border-l-4' : ''
      }`}
      style={{ borderLeftColor: isActive ? color.bg : undefined }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ backgroundColor: color.bg, color: color.text }}
        >
          {getInitials(employee?.fields.mitarbeiter_vorname, employee?.fields.mitarbeiter_nachname)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold truncate">
              {employee?.fields.mitarbeiter_vorname} {employee?.fields.mitarbeiter_nachname}
            </span>
            {shiftType && (
              <Badge
                variant="secondary"
                className="text-xs"
                style={{ backgroundColor: `${color.bg}20`, color: color.bg }}
              >
                {shiftType.fields.schichtart_name}
              </Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {shift.fields.zuweisung_beginn || shiftType?.fields.schichtart_beginn || '—'} - {shift.fields.zuweisung_ende || shiftType?.fields.schichtart_ende || '—'}
          </div>
          {shift.company && (
            <div className="text-xs text-muted-foreground/70 mt-1 truncate">
              {shift.company.fields.unternehmen_name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Timeline view for desktop
function TimelineView({
  shifts,
  shiftTypeColorMap,
  onShiftClick
}: {
  shifts: EnrichedShift[];
  shiftTypeColorMap: Map<string, number>;
  onShiftClick: (shift: EnrichedShift) => void;
}) {
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6:00 - 22:00
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isWorkingHours = currentMinutes >= 360 && currentMinutes <= 1320;

  // Group shifts by employee
  const shiftsByEmployee = useMemo(() => {
    const grouped = new Map<string, EnrichedShift[]>();
    shifts.forEach(shift => {
      const empId = extractRecordId(shift.fields.zuweisung_mitarbeiter);
      if (!empId) return;
      if (!grouped.has(empId)) grouped.set(empId, []);
      grouped.get(empId)!.push(shift);
    });
    return Array.from(grouped.entries());
  }, [shifts]);

  if (shifts.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        Keine Schichten für heute
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Time header */}
      <div className="flex border-b pb-2 mb-2 text-xs text-muted-foreground">
        <div className="w-32 shrink-0" />
        <div className="flex-1 flex">
          {hours.map(hour => (
            <div key={hour} className="flex-1 text-center">
              {hour.toString().padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>

      {/* Current time indicator */}
      {isWorkingHours && isToday(now) && (
        <div
          className="absolute top-8 bottom-0 w-0.5 bg-destructive z-10 animate-pulse"
          style={{
            left: `calc(128px + ${((currentMinutes - 360) / (17 * 60)) * 100}%)`
          }}
        />
      )}

      {/* Employee rows */}
      <div className="space-y-2">
        {shiftsByEmployee.map(([empId, empShifts]) => {
          const employee = empShifts[0]?.employee;
          return (
            <div key={empId} className="flex items-center h-12">
              {/* Employee name */}
              <div className="w-32 shrink-0 pr-2 truncate text-sm font-medium">
                {employee?.fields.mitarbeiter_vorname?.charAt(0)}. {employee?.fields.mitarbeiter_nachname}
              </div>

              {/* Shift bars */}
              <div className="flex-1 relative h-10 bg-muted/30 rounded">
                {empShifts.map(shift => {
                  const start = timeToMinutes(shift.fields.zuweisung_beginn || shift.shiftType?.fields.schichtart_beginn);
                  const end = timeToMinutes(shift.fields.zuweisung_ende || shift.shiftType?.fields.schichtart_ende);
                  const shiftTypeId = extractRecordId(shift.fields.zuweisung_schichtart);
                  const colorIndex = shiftTypeId ? (shiftTypeColorMap.get(shiftTypeId) || 0) : 0;
                  const color = SHIFT_COLORS[colorIndex % SHIFT_COLORS.length];

                  // Calculate position (6:00 = 0%, 22:00 = 100%)
                  const startPercent = Math.max(0, ((start - 360) / (17 * 60)) * 100);
                  const widthPercent = Math.min(100 - startPercent, ((end - start) / (17 * 60)) * 100);

                  return (
                    <div
                      key={shift.record_id}
                      onClick={() => onShiftClick(shift)}
                      className="absolute top-1 bottom-1 rounded cursor-pointer transition-transform hover:scale-[1.02] hover:z-10"
                      style={{
                        left: `${startPercent}%`,
                        width: `${widthPercent}%`,
                        backgroundColor: color.bg,
                        minWidth: '20px'
                      }}
                      title={`${shift.shiftType?.fields.schichtart_name}: ${shift.fields.zuweisung_beginn || shift.shiftType?.fields.schichtart_beginn} - ${shift.fields.zuweisung_ende || shift.shiftType?.fields.schichtart_ende}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Mini calendar widget
function MiniCalendar({
  selectedDate,
  onDateSelect,
  shiftsPerDay
}: {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  shiftsPerDay: Map<string, number>;
}) {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {format(selectedDate, 'MMMM yyyy', { locale: de })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="text-xs text-muted-foreground py-1">
              {day}
            </div>
          ))}
          {days.map(day => {
            const dateKey = format(day, 'yyyy-MM-dd');
            const shiftCount = shiftsPerDay.get(dateKey) || 0;
            const isSelected = format(selectedDate, 'yyyy-MM-dd') === dateKey;
            const isTodayDate = isToday(day);

            return (
              <button
                key={dateKey}
                onClick={() => onDateSelect(day)}
                className={`
                  relative p-2 rounded-lg text-sm transition-colors
                  ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
                  ${isTodayDate && !isSelected ? 'font-bold text-primary' : ''}
                `}
              >
                {format(day, 'd')}
                {shiftCount > 0 && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Shift detail dialog
function ShiftDetailDialog({
  shift,
  open,
  onOpenChange,
  onEdit,
  onDelete
}: {
  shift: EnrichedShift | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  if (!shift) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Schichtdetails</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Employee info */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold"
              style={{ backgroundColor: 'hsl(215 70% 55%)', color: 'white' }}
            >
              {getInitials(shift.employee?.fields.mitarbeiter_vorname, shift.employee?.fields.mitarbeiter_nachname)}
            </div>
            <div>
              <div className="font-semibold">
                {shift.employee?.fields.mitarbeiter_vorname} {shift.employee?.fields.mitarbeiter_nachname}
              </div>
              {shift.employee?.fields.mitarbeiter_email && (
                <div className="text-sm text-muted-foreground">
                  {shift.employee.fields.mitarbeiter_email}
                </div>
              )}
            </div>
          </div>

          {/* Shift details */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Datum</span>
              <span className="font-medium">
                {shift.fields.zuweisung_datum ? format(parseISO(shift.fields.zuweisung_datum), 'PPP', { locale: de }) : '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Uhrzeit</span>
              <span className="font-medium">
                {shift.fields.zuweisung_beginn || shift.shiftType?.fields.schichtart_beginn || '—'} - {shift.fields.zuweisung_ende || shift.shiftType?.fields.schichtart_ende || '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Schichtart</span>
              <span className="font-medium">{shift.shiftType?.fields.schichtart_name || '—'}</span>
            </div>
            {shift.company && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unternehmen</span>
                <span className="font-medium">{shift.company.fields.unternehmen_name}</span>
              </div>
            )}
            {shift.fields.zuweisung_notiz && (
              <div className="pt-2 border-t">
                <span className="text-muted-foreground block mb-1">Notiz</span>
                <p className="text-sm">{shift.fields.zuweisung_notiz}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-2" />
            Bearbeiten
          </Button>
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="w-4 h-4 mr-2" />
            Löschen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add/Edit shift dialog
function ShiftFormDialog({
  open,
  onOpenChange,
  employees,
  shiftTypes,
  companies,
  editingShift,
  onSubmit,
  submitting
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Mitarbeiterverwaltung[];
  shiftTypes: Schichtartenverwaltung[];
  companies: Unternehmensverwaltung[];
  editingShift?: EnrichedShift | null;
  onSubmit: (data: Schichteinteilung['fields']) => Promise<void>;
  submitting: boolean;
}) {
  const [formData, setFormData] = useState<{
    mitarbeiter: string;
    schichtart: string;
    unternehmen: string;
    datum: string;
    beginn: string;
    ende: string;
    notiz: string;
  }>({
    mitarbeiter: '',
    schichtart: '',
    unternehmen: '',
    datum: format(new Date(), 'yyyy-MM-dd'),
    beginn: '',
    ende: '',
    notiz: ''
  });

  // Reset form when dialog opens/closes or editing shift changes
  useEffect(() => {
    if (open && editingShift) {
      setFormData({
        mitarbeiter: extractRecordId(editingShift.fields.zuweisung_mitarbeiter) || '',
        schichtart: extractRecordId(editingShift.fields.zuweisung_schichtart) || '',
        unternehmen: extractRecordId(editingShift.fields.zuweisung_unternehmen) || '',
        datum: editingShift.fields.zuweisung_datum || format(new Date(), 'yyyy-MM-dd'),
        beginn: editingShift.fields.zuweisung_beginn || '',
        ende: editingShift.fields.zuweisung_ende || '',
        notiz: editingShift.fields.zuweisung_notiz || ''
      });
    } else if (open) {
      setFormData({
        mitarbeiter: '',
        schichtart: '',
        unternehmen: companies.length === 1 ? companies[0].record_id : '',
        datum: format(new Date(), 'yyyy-MM-dd'),
        beginn: '',
        ende: '',
        notiz: ''
      });
    }
  }, [open, editingShift, companies]);

  // Auto-fill times from shift type
  useEffect(() => {
    if (formData.schichtart) {
      const shiftType = shiftTypes.find(st => st.record_id === formData.schichtart);
      if (shiftType && !formData.beginn && !formData.ende) {
        setFormData(prev => ({
          ...prev,
          beginn: shiftType.fields.schichtart_beginn || '',
          ende: shiftType.fields.schichtart_ende || ''
        }));
      }
    }
  }, [formData.schichtart, shiftTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data: Schichteinteilung['fields'] = {
      zuweisung_mitarbeiter: formData.mitarbeiter ? createRecordUrl(APP_IDS.MITARBEITERVERWALTUNG, formData.mitarbeiter) : undefined,
      zuweisung_schichtart: formData.schichtart ? createRecordUrl(APP_IDS.SCHICHTARTENVERWALTUNG, formData.schichtart) : undefined,
      zuweisung_unternehmen: formData.unternehmen ? createRecordUrl(APP_IDS.UNTERNEHMENSVERWALTUNG, formData.unternehmen) : undefined,
      zuweisung_datum: formData.datum,
      zuweisung_beginn: formData.beginn || undefined,
      zuweisung_ende: formData.ende || undefined,
      zuweisung_notiz: formData.notiz || undefined
    };

    await onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingShift ? 'Schicht bearbeiten' : 'Schicht zuweisen'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Employee select */}
          <div className="space-y-2">
            <Label htmlFor="mitarbeiter">Mitarbeiter *</Label>
            <Select
              value={formData.mitarbeiter || "placeholder"}
              onValueChange={(v) => setFormData(prev => ({ ...prev, mitarbeiter: v === "placeholder" ? "" : v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Mitarbeiter auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>Mitarbeiter auswählen...</SelectItem>
                {employees.map(emp => (
                  <SelectItem key={emp.record_id} value={emp.record_id}>
                    {emp.fields.mitarbeiter_vorname} {emp.fields.mitarbeiter_nachname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="datum">Datum *</Label>
            <Input
              id="datum"
              type="date"
              value={formData.datum}
              onChange={(e) => setFormData(prev => ({ ...prev, datum: e.target.value }))}
              required
            />
          </div>

          {/* Shift type */}
          <div className="space-y-2">
            <Label htmlFor="schichtart">Schichtart</Label>
            <Select
              value={formData.schichtart || "placeholder"}
              onValueChange={(v) => setFormData(prev => ({ ...prev, schichtart: v === "placeholder" ? "" : v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Schichtart auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="placeholder" disabled>Schichtart auswählen...</SelectItem>
                {shiftTypes.map(st => (
                  <SelectItem key={st.record_id} value={st.record_id}>
                    {st.fields.schichtart_name} ({st.fields.schichtart_beginn} - {st.fields.schichtart_ende})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Time range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="beginn">Beginn</Label>
              <Input
                id="beginn"
                type="time"
                value={formData.beginn}
                onChange={(e) => setFormData(prev => ({ ...prev, beginn: e.target.value }))}
                placeholder="06:00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ende">Ende</Label>
              <Input
                id="ende"
                type="time"
                value={formData.ende}
                onChange={(e) => setFormData(prev => ({ ...prev, ende: e.target.value }))}
                placeholder="14:00"
              />
            </div>
          </div>

          {/* Company (only if multiple) */}
          {companies.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor="unternehmen">Unternehmen</Label>
              <Select
                value={formData.unternehmen || "placeholder"}
                onValueChange={(v) => setFormData(prev => ({ ...prev, unternehmen: v === "placeholder" ? "" : v }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unternehmen auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="placeholder" disabled>Unternehmen auswählen...</SelectItem>
                  {companies.map(c => (
                    <SelectItem key={c.record_id} value={c.record_id}>
                      {c.fields.unternehmen_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notiz">Notiz (optional)</Label>
            <Textarea
              id="notiz"
              value={formData.notiz}
              onChange={(e) => setFormData(prev => ({ ...prev, notiz: e.target.value }))}
              placeholder="Zusätzliche Informationen..."
              rows={2}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={submitting || !formData.mitarbeiter || !formData.datum}>
              {submitting ? 'Speichern...' : (editingShift ? 'Aktualisieren' : 'Zuweisen')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Main Dashboard component
export default function Dashboard() {
  // Data state
  const [shifts, setShifts] = useState<Schichteinteilung[]>([]);
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([]);
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([]);
  const [companies, setCompanies] = useState<Unternehmensverwaltung[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedShift, setSelectedShift] = useState<EnrichedShift | null>(null);
  const [editingShift, setEditingShift] = useState<EnrichedShift | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [shiftsData, employeesData, shiftTypesData, companiesData] = await Promise.all([
        LivingAppsService.getSchichteinteilung(),
        LivingAppsService.getMitarbeiterverwaltung(),
        LivingAppsService.getSchichtartenverwaltung(),
        LivingAppsService.getUnternehmensverwaltung()
      ]);

      setShifts(shiftsData);
      setEmployees(employeesData);
      setShiftTypes(shiftTypesData);
      setCompanies(companiesData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Fehler beim Laden der Daten'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create lookup maps
  const employeeMap = useMemo(() => {
    const map = new Map<string, Mitarbeiterverwaltung>();
    employees.forEach(e => map.set(e.record_id, e));
    return map;
  }, [employees]);

  const shiftTypeMap = useMemo(() => {
    const map = new Map<string, Schichtartenverwaltung>();
    shiftTypes.forEach(st => map.set(st.record_id, st));
    return map;
  }, [shiftTypes]);

  const companyMap = useMemo(() => {
    const map = new Map<string, Unternehmensverwaltung>();
    companies.forEach(c => map.set(c.record_id, c));
    return map;
  }, [companies]);

  // Color index for each shift type
  const shiftTypeColorMap = useMemo(() => {
    const map = new Map<string, number>();
    shiftTypes.forEach((st, index) => map.set(st.record_id, index));
    return map;
  }, [shiftTypes]);

  // Enrich shifts with related data
  const enrichedShifts = useMemo((): EnrichedShift[] => {
    return shifts.map(shift => {
      const empId = extractRecordId(shift.fields.zuweisung_mitarbeiter);
      const stId = extractRecordId(shift.fields.zuweisung_schichtart);
      const compId = extractRecordId(shift.fields.zuweisung_unternehmen);

      return {
        ...shift,
        employee: empId ? employeeMap.get(empId) : undefined,
        shiftType: stId ? shiftTypeMap.get(stId) : undefined,
        company: compId ? companyMap.get(compId) : undefined
      };
    });
  }, [shifts, employeeMap, shiftTypeMap, companyMap]);

  // Filter shifts by selected date
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayShifts = useMemo(() => {
    return enrichedShifts
      .filter(s => s.fields.zuweisung_datum === selectedDateStr)
      .sort((a, b) => {
        const timeA = a.fields.zuweisung_beginn || a.shiftType?.fields.schichtart_beginn || '00:00';
        const timeB = b.fields.zuweisung_beginn || b.shiftType?.fields.schichtart_beginn || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [enrichedShifts, selectedDateStr]);

  // Tomorrow's shifts
  const tomorrowStr = format(addDays(selectedDate, 1), 'yyyy-MM-dd');
  const tomorrowShifts = useMemo(() => {
    return enrichedShifts
      .filter(s => s.fields.zuweisung_datum === tomorrowStr)
      .sort((a, b) => {
        const timeA = a.fields.zuweisung_beginn || a.shiftType?.fields.schichtart_beginn || '00:00';
        const timeB = b.fields.zuweisung_beginn || b.shiftType?.fields.schichtart_beginn || '00:00';
        return timeA.localeCompare(timeB);
      });
  }, [enrichedShifts, tomorrowStr]);

  // Shifts per day for calendar
  const shiftsPerDay = useMemo(() => {
    const counts = new Map<string, number>();
    shifts.forEach(s => {
      if (s.fields.zuweisung_datum) {
        const count = counts.get(s.fields.zuweisung_datum) || 0;
        counts.set(s.fields.zuweisung_datum, count + 1);
      }
    });
    return counts;
  }, [shifts]);

  // Calculate stats
  const uniqueEmployeesToday = useMemo(() => {
    const empIds = new Set<string>();
    todayShifts.forEach(s => {
      const id = extractRecordId(s.fields.zuweisung_mitarbeiter);
      if (id) empIds.add(id);
    });
    return empIds.size;
  }, [todayShifts]);

  // Check if current shift is active
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const isShiftActive = (shift: EnrichedShift): boolean => {
    if (!isToday(selectedDate)) return false;
    const start = timeToMinutes(shift.fields.zuweisung_beginn || shift.shiftType?.fields.schichtart_beginn);
    const end = timeToMinutes(shift.fields.zuweisung_ende || shift.shiftType?.fields.schichtart_ende);
    return currentMinutes >= start && currentMinutes <= end;
  };

  // Handlers
  const handleShiftClick = (shift: EnrichedShift) => {
    setSelectedShift(shift);
    setShowDetailDialog(true);
  };

  const handleEdit = () => {
    setEditingShift(selectedShift);
    setShowDetailDialog(false);
    setShowAddDialog(true);
  };

  const handleDelete = async () => {
    if (!selectedShift) return;

    if (!confirm('Möchten Sie diese Schicht wirklich löschen?')) return;

    try {
      await LivingAppsService.deleteSchichteinteilungEntry(selectedShift.record_id);
      setShowDetailDialog(false);
      setSelectedShift(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to delete shift:', err);
      alert('Fehler beim Löschen der Schicht');
    }
  };

  const handleSubmitShift = async (data: Schichteinteilung['fields']) => {
    setSubmitting(true);
    try {
      if (editingShift) {
        await LivingAppsService.updateSchichteinteilungEntry(editingShift.record_id, data);
      } else {
        await LivingAppsService.createSchichteinteilungEntry(data);
      }
      setShowAddDialog(false);
      setEditingShift(null);
      await fetchData();
    } catch (err) {
      console.error('Failed to save shift:', err);
      alert('Fehler beim Speichern der Schicht');
    } finally {
      setSubmitting(false);
    }
  };

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    if (direction === 'today') {
      setSelectedDate(new Date());
    } else {
      setSelectedDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Fehler beim Laden</h2>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={fetchData}>Erneut versuchen</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Layout */}
      <div className="lg:hidden">
        {/* Header */}
        <header className="sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b z-20 px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Schichtplaner</h1>
              <p className="text-sm text-muted-foreground">
                {isToday(selectedDate) ? 'Heute' : isTomorrow(selectedDate) ? 'Morgen' : format(selectedDate, 'EEEE', { locale: de })}, {format(selectedDate, 'd. MMMM', { locale: de })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <Button
                variant={isToday(selectedDate) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => navigateDate('today')}
              >
                Heute
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Quick stats scroll */}
        <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          <Badge variant="secondary" className="shrink-0 px-3 py-1.5 rounded-full">
            <Calendar className="w-3.5 h-3.5 mr-1.5" />
            {todayShifts.length} Schichten
          </Badge>
          <Badge variant="secondary" className="shrink-0 px-3 py-1.5 rounded-full">
            <Users className="w-3.5 h-3.5 mr-1.5" />
            {uniqueEmployeesToday} Mitarbeiter
          </Badge>
          {tomorrowShifts.length > 0 && (
            <Badge variant="outline" className="shrink-0 px-3 py-1.5 rounded-full">
              Morgen: {tomorrowShifts.length}
            </Badge>
          )}
        </div>

        {/* Shifts list */}
        <main className="px-4 pb-24 space-y-3">
          {todayShifts.length === 0 ? (
            <EmptyState onAddShift={() => setShowAddDialog(true)} />
          ) : (
            todayShifts.map(shift => {
              const stId = extractRecordId(shift.fields.zuweisung_schichtart);
              const colorIndex = stId ? (shiftTypeColorMap.get(stId) || 0) : 0;
              return (
                <ShiftCard
                  key={shift.record_id}
                  shift={shift}
                  colorIndex={colorIndex}
                  isActive={isShiftActive(shift)}
                  onClick={() => handleShiftClick(shift)}
                />
              );
            })
          )}

          {/* Tomorrow preview */}
          {tomorrowShifts.length > 0 && (
            <div className="pt-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                Morgen
                <Badge variant="secondary" className="text-xs">{tomorrowShifts.length}</Badge>
              </h3>
              <div className="space-y-2">
                {tomorrowShifts.slice(0, 3).map(shift => {
                  const stId = extractRecordId(shift.fields.zuweisung_schichtart);
                  const colorIndex = stId ? (shiftTypeColorMap.get(stId) || 0) : 0;
                  return (
                    <ShiftCard
                      key={shift.record_id}
                      shift={shift}
                      colorIndex={colorIndex}
                      isActive={false}
                      onClick={() => handleShiftClick(shift)}
                    />
                  );
                })}
                {tomorrowShifts.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  >
                    Alle {tomorrowShifts.length} anzeigen
                  </Button>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Fixed bottom action */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t z-20">
          <Button
            className="w-full h-14 text-base rounded-xl"
            onClick={() => { setEditingShift(null); setShowAddDialog(true); }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Schicht zuweisen
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Schichtplaner</h1>
              <p className="text-muted-foreground">
                {isToday(selectedDate) ? 'Heute' : isTomorrow(selectedDate) ? 'Morgen' : format(selectedDate, 'EEEE', { locale: de })}, {format(selectedDate, 'd. MMMM yyyy', { locale: de })}
              </p>
            </div>
            <Button onClick={() => { setEditingShift(null); setShowAddDialog(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Schicht zuweisen
            </Button>
          </header>

          {/* Main grid: 65/35 split */}
          <div className="grid grid-cols-[1fr_380px] gap-6">
            {/* Left: Timeline (65%) */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <CardTitle className="text-lg">
                      {isToday(selectedDate) ? 'Heute' : format(selectedDate, 'EEEE, d. MMMM', { locale: de })}
                    </CardTitle>
                    <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                  {!isToday(selectedDate) && (
                    <Button variant="outline" size="sm" onClick={() => navigateDate('today')}>
                      Heute
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {todayShifts.length === 0 ? (
                  <EmptyState onAddShift={() => setShowAddDialog(true)} />
                ) : (
                  <TimelineView
                    shifts={todayShifts}
                    shiftTypeColorMap={shiftTypeColorMap}
                    onShiftClick={handleShiftClick}
                  />
                )}
              </CardContent>
            </Card>

            {/* Right sidebar (35%) */}
            <div className="space-y-6">
              {/* Stats */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{todayShifts.length}</div>
                      <div className="text-xs text-muted-foreground">Schichten</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{uniqueEmployeesToday}</div>
                      <div className="text-xs text-muted-foreground">Mitarbeiter</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{employees.length - uniqueEmployeesToday}</div>
                      <div className="text-xs text-muted-foreground">Verfügbar</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mini calendar */}
              <MiniCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                shiftsPerDay={shiftsPerDay}
              />

              {/* Upcoming shifts */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    Morgen
                    {tomorrowShifts.length > 0 && (
                      <Badge variant="secondary" className="text-xs">{tomorrowShifts.length}</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tomorrowShifts.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      Keine Schichten geplant
                    </p>
                  ) : (
                    <>
                      {tomorrowShifts.slice(0, 5).map(shift => (
                        <div
                          key={shift.record_id}
                          className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                          onClick={() => handleShiftClick(shift)}
                        >
                          <div className="text-sm font-medium truncate">
                            {shift.employee?.fields.mitarbeiter_vorname?.charAt(0)}. {shift.employee?.fields.mitarbeiter_nachname}
                          </div>
                          <div className="text-sm text-muted-foreground ml-auto">
                            {shift.fields.zuweisung_beginn || shift.shiftType?.fields.schichtart_beginn} - {shift.fields.zuweisung_ende || shift.shiftType?.fields.schichtart_ende}
                          </div>
                        </div>
                      ))}
                      {tomorrowShifts.length > 5 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-muted-foreground"
                          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        >
                          Alle anzeigen
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <ShiftDetailDialog
        shift={selectedShift}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ShiftFormDialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) setEditingShift(null);
        }}
        employees={employees}
        shiftTypes={shiftTypes}
        companies={companies}
        editingShift={editingShift}
        onSubmit={handleSubmitShift}
        submitting={submitting}
      />
    </div>
  );
}

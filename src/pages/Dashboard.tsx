import { useEffect, useMemo, useState } from 'react'
import type {
  Schichteinteilung,
  Mitarbeiterverwaltung,
  Schichtartenverwaltung,
} from '@/types/app'
import {
  LivingAppsService,
  extractRecordId,
  createRecordUrl,
} from '@/services/livingAppsService'

// ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { PlusCircle, User, AlarmClock } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'

import { format, parseISO, startOfToday, isSameDay, eachDayOfInterval, addDays, startOfWeek, endOfWeek, isSameWeek } from 'date-fns'
import { de } from 'date-fns/locale'

interface ShiftJoined extends Schichteinteilung {
  employee?: Mitarbeiterverwaltung
  shiftType?: Schichtartenverwaltung
}

export default function Dashboard() {
  const isMobile = useIsMobile()

  const [shifts, setShifts] = useState<Schichteinteilung[]>([])
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([])
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [s, e, st] = await Promise.all([
          LivingAppsService.getSchichteinteilung(),
          LivingAppsService.getMitarbeiterverwaltung(),
          LivingAppsService.getSchichtartenverwaltung(),
        ])
        setShifts(s)
        setEmployees(e)
        setShiftTypes(st)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = startOfToday()

  // --- Helpers ---
  const employeeMap = useMemo(() => {
    const m = new Map<string, Mitarbeiterverwaltung>()
    employees.forEach((e) => m.set(e.record_id, e))
    return m
  }, [employees])

  const shiftTypeMap = useMemo(() => {
    const m = new Map<string, Schichtartenverwaltung>()
    shiftTypes.forEach((t) => m.set(t.record_id, t))
    return m
  }, [shiftTypes])

  const joinedShifts: ShiftJoined[] = useMemo(() => {
    return shifts.map((s) => {
      const empId = extractRecordId(s.fields.zuweisung_mitarbeiter)
      const typeId = extractRecordId(s.fields.zuweisung_schichtart)
      return {
        ...s,
        employee: empId ? employeeMap.get(empId) : undefined,
        shiftType: typeId ? shiftTypeMap.get(typeId) : undefined,
      }
    })
  }, [shifts, employeeMap, shiftTypeMap])

  // --- KPI Calculations ---
  const shiftsToday = joinedShifts.filter((s) =>
    isSameDay(parseISO(s.fields.zuweisung_datum || ''), today)
  )

  const heroCount = shiftsToday.length

  const distinctEmployeesToday = new Set(
    shiftsToday
      .map((s) => extractRecordId(s.fields.zuweisung_mitarbeiter))
      .filter(Boolean)
  ).size

  const totalEmployees = employees.length

  const capacityPercent = totalEmployees
    ? Math.round((distinctEmployeesToday / totalEmployees) * 100)
    : 0

  // Offene Schichten diese Woche
  const weekStart = startOfWeek(today, { locale: de, weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { locale: de, weekStartsOn: 1 })

  const openWeekShifts = joinedShifts.filter((s) => {
    const dateStr = s.fields.zuweisung_datum
    if (!dateStr) return false
    const date = parseISO(dateStr)
    if (!isSameWeek(date, today, { locale: de, weekStartsOn: 1 })) return false
    return !s.fields.zuweisung_mitarbeiter
  }).length

  // Chart data: last 7 days including today
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({ start: addDays(today, -6), end: today })
    return days.map((d) => {
      const count = joinedShifts.filter((s) =>
        isSameDay(parseISO(s.fields.zuweisung_datum || ''), d)
      ).length
      return {
        date: format(d, 'EEE', { locale: de }),
        count,
      }
    })
  }, [joinedShifts, today])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive font-medium">{error.message}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Neu laden
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 grid gap-6 md:grid-cols-[1fr_0.6fr]">
      {/* Hero KPI */}
      <HeroCard
        count={heroCount}
        percent={capacityPercent}
        className="md:col-span-1"
      />

      {/* Secondary KPIs - mobile horizontal scroll */}
      <div className={isMobile ? 'flex gap-4 overflow-x-auto pb-2' : 'grid grid-cols-3 gap-4 md:col-span-1'}>
        <StatCard title="Mitarbeiter im Einsatz" value={distinctEmployeesToday} icon={User} />
        <StatCard title="Offene Schichten Woche" value={openWeekShifts} icon={AlarmClock} />
        <StatCard title="Schichtarten" value={shiftTypes.length} />
      </div>

      {/* Chart */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Schichten pro Tag (7 Tage)</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Shift list today */}
      <Card className="md:col-span-1 md:row-span-2 overflow-hidden relative">
        <div className="absolute left-2 top-0 bottom-0 w-1 bg-accent rounded" />
        <CardHeader>
          <CardTitle>Heute</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
          {shiftsToday.length === 0 && (
            <p className="text-muted-foreground">Keine Schichten geplant</p>
          )}
          {shiftsToday
            .sort((a, b) => {
              const aBeg = a.fields.zuweisung_beginn || ''
              const bBeg = b.fields.zuweisung_beginn || ''
              return aBeg.localeCompare(bBeg)
            })
            .map((s) => (
              <ShiftRow key={s.record_id} shift={s} employeeMap={employeeMap} shiftTypeMap={shiftTypeMap} />
            ))}
        </CardContent>
      </Card>

      {/* Primary Action Button positions */}
      {isMobile ? <AddShiftFab employees={employees} shiftTypes={shiftTypes} /> : null}

    </div>
  )
}

// --- Components ---

function HeroCard({ count, percent, className }: { count: number; percent: number; className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="flex flex-col items-center justify-center py-10">
        <div className="relative mb-4">
          <svg width={140} height={140} className="rotate-[-90deg]">
            <circle
              cx={70}
              cy={70}
              r={60}
              stroke="hsl(var(--muted))"
              strokeWidth={8}
              fill="transparent"
            />
            <circle
              cx={70}
              cy={70}
              r={60}
              stroke="hsl(var(--primary))"
              strokeWidth={8}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 60}
              strokeDashoffset={(1 - percent / 100) * 2 * Math.PI * 60}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold">
            {count}
          </span>
        </div>
        <p className="text-muted-foreground">Schichten heute geplant</p>
        <p className="text-sm text-muted-foreground mt-1">{percent}% Kapazität belegt</p>
      </CardContent>
    </Card>
  )
}

function StatCard({ title, value, icon: Icon }: { title: string; value: number; icon?: any }) {
  return (
    <Card className="min-w-[160px] flex-1">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function ShiftRow({
  shift,
  employeeMap,
  shiftTypeMap,
}: {
  shift: Schichteinteilung
  employeeMap: Map<string, Mitarbeiterverwaltung>
  shiftTypeMap: Map<string, Schichtartenverwaltung>
}) {
  const empId = extractRecordId(shift.fields.zuweisung_mitarbeiter)
  const employee = empId ? employeeMap.get(empId) : null
  const typeId = extractRecordId(shift.fields.zuweisung_schichtart)
  const shiftType = typeId ? shiftTypeMap.get(typeId) : null

  const start = shift.fields.zuweisung_beginn || '--'
  const end = shift.fields.zuweisung_ende || '--'

  return (
    <div className="relative pl-6">
      <div className="absolute left-[-2px] top-4 h-2 w-2 rounded-full bg-accent" />
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="py-3 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{start} – {end}</span>
            {shiftType?.fields.schichtart_name ? (
              <span className="before:content-['•'] before:mx-1" />
            ) : null}
            <span>{shiftType?.fields.schichtart_name}</span>
          </div>
          <div className="font-medium">
            {employee ? `${employee.fields.mitarbeiter_vorname ?? ''} ${employee.fields.mitarbeiter_nachname ?? ''}`.trim() : 'Offen'}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Add Shift Dialog and FAB ---

interface AddShiftFormData {
  mitarbeiter?: string
  schichtart?: string
  unternehmen?: string
  datum?: string
  beginn?: string
  ende?: string
  notiz?: string
}

function AddShiftFab({
  employees,
  shiftTypes,
}: {
  employees: Mitarbeiterverwaltung[]
  shiftTypes: Schichtartenverwaltung[]
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AddShiftFormData>({})
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.datum) return
    setSaving(true)
    try {
      await LivingAppsService.createSchichteinteilungEntry({
        zuweisung_mitarbeiter: form.mitarbeiter
          ? createRecordUrl('682651b67f1fb97703cf487a', form.mitarbeiter)
          : undefined,
        zuweisung_schichtart: form.schichtart
          ? createRecordUrl('682651bf710e2817fd194864', form.schichtart)
          : undefined,
        zuweisung_unternehmen: form.unternehmen
          ? createRecordUrl('68b04d9e0d0c4ed362914845', form.unternehmen)
          : undefined,
        zuweisung_datum: form.datum, // YYYY-MM-DD
        zuweisung_beginn: form.beginn,
        zuweisung_ende: form.ende,
        zuweisung_notiz: form.notiz,
      })
      setOpen(false)
      window.location.reload()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="fixed bottom-6 right-6 rounded-full bg-primary text-primary-foreground p-4 shadow-lg flex items-center gap-2"
        >
          <PlusCircle className="h-6 w-6" />
          <span className="sr-only">Schicht anlegen</span>
        </button>
      </DialogTrigger>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>Schicht anlegen</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Mitarbeiter Select */}
          <Select value={form.mitarbeiter ?? ''} onValueChange={(v) => setForm((f) => ({ ...f, mitarbeiter: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Mitarbeiter wählen" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((e) => (
                <SelectItem key={e.record_id} value={e.record_id}>
                  {e.fields.mitarbeiter_vorname} {e.fields.mitarbeiter_nachname}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Schichtart Select */}
          <Select value={form.schichtart ?? ''} onValueChange={(v) => setForm((f) => ({ ...f, schichtart: v }))}>
            <SelectTrigger>
              <SelectValue placeholder="Schichtart wählen" />
            </SelectTrigger>
            <SelectContent>
              {shiftTypes.map((s) => (
                <SelectItem key={s.record_id} value={s.record_id}>
                  {s.fields.schichtart_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date */}
          <Input
            type="date"
            value={form.datum ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))}
          />
          {/* Beginn / Ende */}
          <div className="flex gap-3">
            <Input
              placeholder="Beginn"
              value={form.beginn ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, beginn: e.target.value }))}
            />
            <Input
              placeholder="Ende"
              value={form.ende ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, ende: e.target.value }))}
            />
          </div>
          {/* Notiz */}
          <Input
            placeholder="Notiz (optional)"
            value={form.notiz ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notiz: e.target.value }))}
          />
          <Button onClick={save} disabled={saving} className="w-full">
            {saving ? 'Speichern…' : 'Speichern'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useCallback, useEffect, useMemo, useState } from 'react'
import { format, addDays, parseISO, isWithinInterval } from 'date-fns'
import { de } from 'date-fns/locale'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { AlertCircle, CalendarDays, Clock, Users } from 'lucide-react'
import { LivingAppsService, createRecordUrl, extractRecordId } from '@/services/livingAppsService'
import { APP_IDS } from '@/types/app'
import type {
  Unternehmensverwaltung,
  Schichtartenverwaltung,
  Schichteinteilung,
  Mitarbeiterverwaltung,
} from '@/types/app'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

type FormState = {
  zuweisung_datum: string
  zuweisung_beginn: string
  zuweisung_ende: string
  mitarbeiter_id: string
  unternehmen_id: string
  schichtart_id: string
  zuweisung_notiz: string
}

type EnrichedAssignment = {
  record_id: string
  dateTime: Date
  dateLabel: string
  timeLabel: string
  employeeName: string
  companyName: string
  shiftTypeName: string
}

const initialFormState: FormState = {
  zuweisung_datum: '',
  zuweisung_beginn: '',
  zuweisung_ende: '',
  mitarbeiter_id: '',
  unternehmen_id: '',
  schichtart_id: '',
  zuweisung_notiz: '',
}

function getEmployeeName(employee: Mitarbeiterverwaltung | null) {
  if (!employee) return 'Unbekannt'
  const first = employee.fields.mitarbeiter_vorname ?? ''
  const last = employee.fields.mitarbeiter_nachname ?? ''
  const full = `${first} ${last}`.trim()
  return full.length > 0 ? full : 'Unbekannt'
}

function getCompanyName(company: Unternehmensverwaltung | null) {
  return company?.fields.unternehmen_name || 'Unbekannt'
}

function getShiftTypeName(shiftType: Schichtartenverwaltung | null) {
  return shiftType?.fields.schichtart_name || 'Unbekannt'
}

function parseAssignmentDateTime(assignment: Schichteinteilung) {
  const date = assignment.fields.zuweisung_datum
  if (!date) return null
  const time = assignment.fields.zuweisung_beginn || '00:00'
  return parseISO(`${date}T${time}`)
}

function formatDateLabel(date: Date) {
  return format(date, 'dd.MM', { locale: de })
}

function formatDayLabel(date: Date) {
  return format(date, 'EEE', { locale: de })
}

function LoadingState() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-44" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <Skeleton className="h-[320px] w-full" />
            <Skeleton className="h-[260px] w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[260px] w-full" />
            <Skeleton className="h-[220px] w-full" />
          </div>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
          <Skeleton className="h-[120px] w-full" />
        </div>
      </div>
    </div>
  )
}

function ErrorState({ onRetry, message }: { onRetry: () => void; message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pb-20 pt-24 text-center">
        <Alert className="w-full">
          <AlertTitle className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Fehler beim Laden
          </AlertTitle>
          <AlertDescription className="mt-2 text-sm text-muted-foreground">
            {message}
          </AlertDescription>
          <div className="mt-4">
            <Button onClick={onRetry} className="active:scale-[0.98]">
              Neu laden
            </Button>
          </div>
        </Alert>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [companies, setCompanies] = useState<Unternehmensverwaltung[]>([])
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([])
  const [assignments, setAssignments] = useState<Schichteinteilung[]>([])
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [loadedCompanies, loadedShiftTypes, loadedAssignments, loadedEmployees] =
        await Promise.all([
          LivingAppsService.getUnternehmensverwaltung(),
          LivingAppsService.getSchichtartenverwaltung(),
          LivingAppsService.getSchichteinteilung(),
          LivingAppsService.getMitarbeiterverwaltung(),
        ])
      setCompanies(loadedCompanies)
      setShiftTypes(loadedShiftTypes)
      setAssignments(loadedAssignments)
      setEmployees(loadedEmployees)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unbekannter Fehler'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const employeeMap = useMemo(() => {
    return new Map(employees.map((employee) => [employee.record_id, employee]))
  }, [employees])

  const companyMap = useMemo(() => {
    return new Map(companies.map((company) => [company.record_id, company]))
  }, [companies])

  const shiftTypeMap = useMemo(() => {
    return new Map(shiftTypes.map((shiftType) => [shiftType.record_id, shiftType]))
  }, [shiftTypes])

  const today = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate())
  }, [])

  const countsByDate = useMemo(() => {
    const counts = new Map<string, number>()
    assignments.forEach((assignment) => {
      const date = assignment.fields.zuweisung_datum
      if (!date) return
      counts.set(date, (counts.get(date) || 0) + 1)
    })
    return counts
  }, [assignments])

  const heroCount = useMemo(() => {
    const todayKey = format(today, 'yyyy-MM-dd')
    return countsByDate.get(todayKey) || 0
  }, [countsByDate, today])

  const weekPulse = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(today, index)
      const dateKey = format(date, 'yyyy-MM-dd')
      return {
        dateKey,
        label: formatDayLabel(date),
        day: format(date, 'dd.MM', { locale: de }),
        count: countsByDate.get(dateKey) || 0,
        isToday: index === 0,
      }
    })
  }, [countsByDate, today])

  const upcomingAssignments = useMemo(() => {
    const enriched: EnrichedAssignment[] = []
    assignments.forEach((assignment) => {
      const dateTime = parseAssignmentDateTime(assignment)
      if (!dateTime) return
      if (dateTime < today) return

      const employeeId = extractRecordId(assignment.fields.zuweisung_mitarbeiter)
      const companyId = extractRecordId(assignment.fields.zuweisung_unternehmen)
      const shiftTypeId = extractRecordId(assignment.fields.zuweisung_schichtart)

      enriched.push({
        record_id: assignment.record_id,
        dateTime,
        dateLabel: formatDateLabel(dateTime),
        timeLabel: `${assignment.fields.zuweisung_beginn || '--:--'} - ${
          assignment.fields.zuweisung_ende || '--:--'
        }`,
        employeeName: getEmployeeName(
          employeeId ? employeeMap.get(employeeId) || null : null
        ),
        companyName: getCompanyName(companyId ? companyMap.get(companyId) || null : null),
        shiftTypeName: getShiftTypeName(
          shiftTypeId ? shiftTypeMap.get(shiftTypeId) || null : null
        ),
      })
    })

    return enriched.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())
  }, [assignments, companyMap, employeeMap, shiftTypeMap, today])

  const nextAssignments = upcomingAssignments.slice(0, 5)
  const nextShiftTime = nextAssignments[0]
    ? format(nextAssignments[0].dateTime, 'HH:mm')
    : '--:--'

  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const date = addDays(today, index)
      const dateKey = format(date, 'yyyy-MM-dd')
      return {
        label: formatDateLabel(date),
        count: countsByDate.get(dateKey) || 0,
      }
    })
  }, [countsByDate, today])

  const unassignedEmployees = useMemo(() => {
    if (employees.length === 0) return []
    const interval = { start: today, end: addDays(today, 6) }
    const assignedEmployeeIds = new Set<string>()

    assignments.forEach((assignment) => {
      const dateValue = assignment.fields.zuweisung_datum
      if (!dateValue) return
      const date = parseISO(dateValue)
      if (!isWithinInterval(date, interval)) return

      const employeeId = extractRecordId(assignment.fields.zuweisung_mitarbeiter)
      if (employeeId) assignedEmployeeIds.add(employeeId)
    })

    return employees
      .filter((employee) => !assignedEmployeeIds.has(employee.record_id))
      .sort((a, b) => {
        const nameA = getEmployeeName(a)
        const nameB = getEmployeeName(b)
        return nameA.localeCompare(nameB)
      })
      .slice(0, 6)
  }, [assignments, employees, today])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setFormError(null)
    setSuccessMessage(null)

    if (
      !formState.zuweisung_datum ||
      !formState.zuweisung_beginn ||
      !formState.zuweisung_ende ||
      !formState.mitarbeiter_id ||
      !formState.unternehmen_id ||
      !formState.schichtart_id
    ) {
      setFormError('Bitte alle Pflichtfelder ausfuellen.')
      return
    }

    try {
      const payload: Schichteinteilung['fields'] = {
        zuweisung_datum: formState.zuweisung_datum,
        zuweisung_beginn: formState.zuweisung_beginn,
        zuweisung_ende: formState.zuweisung_ende,
        zuweisung_mitarbeiter: createRecordUrl(
          APP_IDS.MITARBEITERVERWALTUNG,
          formState.mitarbeiter_id
        ),
        zuweisung_unternehmen: createRecordUrl(
          APP_IDS.UNTERNEHMENSVERWALTUNG,
          formState.unternehmen_id
        ),
        zuweisung_schichtart: createRecordUrl(
          APP_IDS.SCHICHTARTENVERWALTUNG,
          formState.schichtart_id
        ),
        zuweisung_notiz: formState.zuweisung_notiz || undefined,
      }

      await LivingAppsService.createSchichteinteilungEntry(payload)
      setSuccessMessage('Schicht gespeichert.')
      setFormState(initialFormState)
      setDialogOpen(false)
      await loadData()
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Speichern fehlgeschlagen.'
      )
    }
  }

  if (loading) {
    return <LoadingState />
  }

  if (error) {
    return (
      <ErrorState
        onRetry={() => {
          void loadData()
        }}
        message={error.message}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-16 top-10 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 top-32 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-8 sm:pb-16 sm:pt-10">
            <header className="flex flex-wrap items-center justify-between gap-4 animate-in fade-in duration-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Uebersicht
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                  Schichtplaner
                </h1>
                <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {format(today, 'dd.MM.yyyy')}
                </div>
              </div>
              <DialogTrigger asChild>
                <Button className="hidden h-11 px-6 text-sm font-semibold shadow-sm transition active:scale-[0.98] sm:inline-flex">
                  Schicht zuweisen
                </Button>
              </DialogTrigger>
            </header>

            {successMessage ? (
              <Alert className="mt-6 animate-in fade-in duration-500">
                <AlertTitle>Erfolgreich</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            ) : null}

            <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
              <div className="flex flex-col gap-6">
                <Card className="group border-border/70 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Schichten heute
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="text-5xl font-semibold tracking-tight">
                          {heroCount}
                        </div>
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          Naechste Schicht: {nextShiftTime}
                        </div>
                      </div>
                      <div className="rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent-foreground">
                        Heute
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="flex items-end gap-2 overflow-x-auto pb-2">
                        {weekPulse.map((day) => (
                          <div
                            key={day.dateKey}
                            className={cn(
                              'min-w-[72px] rounded-xl border bg-card px-2 py-2 text-center transition-shadow',
                              day.isToday
                                ? 'border-accent/60 shadow-sm'
                                : 'border-border'
                            )}
                          >
                            <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                              {day.label}
                            </div>
                            <div className="mt-1 text-lg font-semibold">
                              {day.count}
                            </div>
                            <div
                              className={cn(
                                'mt-2 h-1 rounded-full',
                                day.isToday
                                  ? 'mx-auto w-8 bg-accent'
                                  : 'mx-auto w-6 bg-muted'
                              )}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Schichten in den naechsten 14 Tagen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {assignments.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>Keine Schichten geplant</EmptyTitle>
                          <EmptyDescription>
                            Erfasse die erste Schicht, um den Trend zu sehen.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="h-[220px] sm:h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient
                                id="shiftArea"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <stop
                                  offset="0%"
                                  stopColor="hsl(var(--primary))"
                                  stopOpacity={0.35}
                                />
                                <stop
                                  offset="100%"
                                  stopColor="hsl(var(--primary))"
                                  stopOpacity={0}
                                />
                              </linearGradient>
                            </defs>
                            <XAxis
                              dataKey="label"
                              tick={{ fontSize: 11 }}
                              interval={1}
                              stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              stroke="hsl(var(--muted-foreground))"
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--popover))',
                                borderColor: 'hsl(var(--border))',
                                borderRadius: '12px',
                                fontSize: '12px',
                              }}
                              labelStyle={{ color: 'hsl(var(--foreground))' }}
                            />
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke="hsl(var(--primary))"
                              strokeWidth={2}
                              fill="url(#shiftArea)"
                              dot={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col gap-6">
                <Card className="border-border/70 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Naechste Schichten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {nextAssignments.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>Keine Zuweisungen</EmptyTitle>
                          <EmptyDescription>
                            Fuege eine neue Schicht hinzu, um loszulegen.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="space-y-3">
                        {nextAssignments.map((assignment) => (
                          <div
                            key={assignment.record_id}
                            className="flex gap-3 rounded-xl border border-border/70 bg-card p-3 transition-shadow hover:shadow-md"
                          >
                            <div className="mt-1 h-10 w-1 rounded-full bg-accent/80" />
                            <div className="flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <div className="text-sm font-semibold">
                                  {assignment.employeeName}
                                </div>
                                <Badge variant="secondary">
                                  {assignment.dateLabel}
                                </Badge>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {assignment.shiftTypeName} - {assignment.companyName}
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                {assignment.timeLabel}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/70 shadow-sm transition-shadow hover:shadow-md">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Ohne Zuweisung (7 Tage)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {employees.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>Keine Mitarbeiter</EmptyTitle>
                          <EmptyDescription>
                            Lege Mitarbeiter an, um die Planung zu starten.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : unassignedEmployees.length === 0 ? (
                      <Empty>
                        <EmptyHeader>
                          <EmptyTitle>Alle zugewiesen</EmptyTitle>
                          <EmptyDescription>
                            Jeder Mitarbeiter hat eine Schicht in den naechsten
                            Tagen.
                          </EmptyDescription>
                        </EmptyHeader>
                      </Empty>
                    ) : (
                      <div className="space-y-3">
                        {unassignedEmployees.map((employee) => {
                          const contact =
                            employee.fields.mitarbeiter_email ||
                            employee.fields.mitarbeiter_telefon ||
                            'Keine Kontaktdaten'
                          return (
                            <div
                              key={employee.record_id}
                              className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm transition-shadow hover:shadow-md"
                            >
                              <div className="font-semibold">
                                {getEmployeeName(employee)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {contact}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card className="border-border/70 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Mitarbeiter gesamt
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-2xl font-semibold">
                    {employees.length}
                  </div>
                  <div className="rounded-full bg-muted p-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/70 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Unternehmen gesamt
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-2xl font-semibold">
                    {companies.length}
                  </div>
                  <div className="rounded-full bg-muted p-2 text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border/70 shadow-sm transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Schichtarten gesamt
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="text-2xl font-semibold">
                    {shiftTypes.length}
                  </div>
                  <div className="rounded-full bg-muted p-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogTrigger asChild>
              <Button className="fixed bottom-4 left-1/2 z-40 w-[min(92%,420px)] -translate-x-1/2 shadow-lg transition active:scale-[0.98] sm:hidden">
                Schicht zuweisen
              </Button>
            </DialogTrigger>
          </div>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Schicht zuweisen</DialogTitle>
            </DialogHeader>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="datum">Datum</Label>
                  <Input
                    id="datum"
                    type="date"
                    value={formState.zuweisung_datum}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        zuweisung_datum: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="beginn">Beginn</Label>
                  <Input
                    id="beginn"
                    type="time"
                    value={formState.zuweisung_beginn}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        zuweisung_beginn: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ende">Ende</Label>
                  <Input
                    id="ende"
                    type="time"
                    value={formState.zuweisung_ende}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        zuweisung_ende: event.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mitarbeiter</Label>
                  <Select
                    value={formState.mitarbeiter_id || undefined}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        mitarbeiter_id: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mitarbeiter waehlen" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem
                          key={employee.record_id}
                          value={employee.record_id}
                        >
                          {getEmployeeName(employee)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unternehmen</Label>
                  <Select
                    value={formState.unternehmen_id || undefined}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        unternehmen_id: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unternehmen waehlen" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies.map((company) => (
                        <SelectItem
                          key={company.record_id}
                          value={company.record_id}
                        >
                          {getCompanyName(company)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Schichtart</Label>
                  <Select
                    value={formState.schichtart_id || undefined}
                    onValueChange={(value) =>
                      setFormState((prev) => ({
                        ...prev,
                        schichtart_id: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Schichtart waehlen" />
                    </SelectTrigger>
                    <SelectContent>
                      {shiftTypes.map((shiftType) => (
                        <SelectItem
                          key={shiftType.record_id}
                          value={shiftType.record_id}
                        >
                          {getShiftTypeName(shiftType)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notiz">Notiz (optional)</Label>
                <Textarea
                  id="notiz"
                  value={formState.zuweisung_notiz}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      zuweisung_notiz: event.target.value,
                    }))
                  }
                  rows={3}
                />
              </div>

              {formError ? (
                <Alert variant="destructive">
                  <AlertTitle>Fehler</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  className="active:scale-[0.98]"
                >
                  Abbrechen
                </Button>
                <Button type="submit" className="active:scale-[0.98]">
                  Schicht speichern
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

import { useCallback, useEffect, useMemo, useState } from "react"
import {
  addDays,
  compareAsc,
  format,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  set,
  startOfToday,
} from "date-fns"
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  Building2,
  CalendarClock,
  ChevronRight,
  Layers3,
  Plus,
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  LivingAppsService,
  createRecordUrl,
  extractRecordId,
} from "@/services/livingAppsService"
import { APP_IDS } from "@/types/app"
import type {
  CreateSchichteinteilung,
  Mitarbeiterverwaltung,
  Schichteinteilung,
  Schichtartenverwaltung,
  Unternehmensverwaltung,
} from "@/types/app"
import { Toaster, toast } from "sonner"

const chartAccent = "hsl(186 55% 35%)"

const emptyFormState = {
  date: "",
  start: "",
  end: "",
  employeeId: "",
  companyId: "",
  shiftTypeId: "",
  note: "",
}

type ShiftFormState = typeof emptyFormState

type ShiftWithDateTime = {
  shift: Schichteinteilung
  dateTime: Date
}

function safeParseDate(dateValue?: string) {
  if (!dateValue) return null
  const parsed = parseISO(dateValue)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function buildShiftDateTime(shift: Schichteinteilung) {
  const date = safeParseDate(shift.fields.zuweisung_datum)
  if (!date) return null
  const timeValue = shift.fields.zuweisung_beginn
  if (!timeValue) return set(date, { hours: 12, minutes: 0 })
  const [hours, minutes] = timeValue.split(":").map((value) => Number(value))
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return set(date, { hours: 12, minutes: 0 })
  }
  return set(date, { hours, minutes })
}

function formatShiftTimeRange(shift: Schichteinteilung) {
  const startTime = shift.fields.zuweisung_beginn
  const endTime = shift.fields.zuweisung_ende
  if (startTime && endTime) return `${startTime} – ${endTime}`
  if (startTime) return `${startTime} – offen`
  if (endTime) return `offen – ${endTime}`
  return "Zeit offen"
}

function formatEmployeeName(employee?: Mitarbeiterverwaltung) {
  if (!employee) return "Nicht zugewiesen"
  const firstName = employee.fields.mitarbeiter_vorname || ""
  const lastName = employee.fields.mitarbeiter_nachname || ""
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName.length ? fullName : "Unbenannt"
}

function formatCompanyName(company?: Unternehmensverwaltung) {
  return company?.fields.unternehmen_name || "Unternehmen offen"
}

function formatShiftTypeName(shiftType?: Schichtartenverwaltung) {
  return shiftType?.fields.schichtart_name || "Schichtart offen"
}

export default function Dashboard() {
  const isMobile = useIsMobile()
  const today = useMemo(() => startOfToday(), [])
  const weekEnd = useMemo(() => addDays(today, 6), [today])

  const [companies, setCompanies] = useState<Unternehmensverwaltung[]>([])
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([])
  const [shifts, setShifts] = useState<Schichteinteilung[]>([])
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formState, setFormState] = useState<ShiftFormState>(emptyFormState)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedShift, setSelectedShift] = useState<Schichteinteilung | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        companyData,
        shiftTypeData,
        shiftData,
        employeeData,
      ] = await Promise.all([
        LivingAppsService.getUnternehmensverwaltung(),
        LivingAppsService.getSchichtartenverwaltung(),
        LivingAppsService.getSchichteinteilung(),
        LivingAppsService.getMitarbeiterverwaltung(),
      ])

      setCompanies(companyData)
      setShiftTypes(shiftTypeData)
      setShifts(shiftData)
      setEmployees(employeeData)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler"
      setError(message)
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

  const shiftsThisWeek = useMemo(() => {
    return shifts.filter((shift) => {
      const date = safeParseDate(shift.fields.zuweisung_datum)
      if (!date) return false
      return isWithinInterval(date, { start: today, end: weekEnd })
    })
  }, [shifts, today, weekEnd])

  const shiftsToday = useMemo(() => {
    return shifts.filter((shift) => {
      const date = safeParseDate(shift.fields.zuweisung_datum)
      if (!date) return false
      return isSameDay(date, today)
    })
  }, [shifts, today])

  const nextShift = useMemo<ShiftWithDateTime | null>(() => {
    const now = new Date()
    const upcoming = shifts
      .map((shift) => {
        const dateTime = buildShiftDateTime(shift)
        return dateTime ? { shift, dateTime } : null
      })
      .filter((entry): entry is ShiftWithDateTime => entry !== null)
      .filter((entry) => !isBefore(entry.dateTime, now))
      .sort((a, b) => compareAsc(a.dateTime, b.dateTime))

    return upcoming[0] || null
  }, [shifts])

  const shiftCountByDate = useMemo(() => {
    const map = new Map<string, number>()
    shifts.forEach((shift) => {
      const dateValue = shift.fields.zuweisung_datum
      if (!dateValue) return
      map.set(dateValue, (map.get(dateValue) || 0) + 1)
    })
    return map
  }, [shifts])

  const chartData = useMemo(() => {
    return Array.from({ length: 14 }, (_, index) => {
      const date = addDays(today, index)
      const key = format(date, "yyyy-MM-dd")
      return {
        dateLabel: format(date, "dd.MM"),
        count: shiftCountByDate.get(key) || 0,
      }
    })
  }, [today, shiftCountByDate])

  const upcomingShifts = useMemo(() => {
    const now = new Date()
    return [...shifts]
      .map((shift) => ({ shift, dateTime: buildShiftDateTime(shift) }))
      .filter(
        (entry): entry is ShiftWithDateTime =>
          entry.dateTime !== null && !isBefore(entry.dateTime, now)
      )
      .sort((a, b) => compareAsc(a.dateTime, b.dateTime))
      .map((entry) => entry.shift)
      .slice(0, 8)
  }, [shifts])

  const employeesSorted = useMemo(() => {
    return [...employees]
      .sort((a, b) => {
        const aName = a.fields.mitarbeiter_nachname || ""
        const bName = b.fields.mitarbeiter_nachname || ""
        return aName.localeCompare(bName, "de")
      })
      .slice(0, isMobile ? 4 : 5)
  }, [employees, isMobile])

  const companiesSorted = useMemo(() => {
    return [...companies]
      .sort((a, b) => {
        const aName = a.fields.unternehmen_name || ""
        const bName = b.fields.unternehmen_name || ""
        return aName.localeCompare(bName, "de")
      })
      .slice(0, 4)
  }, [companies])

  const shiftTypesSorted = useMemo(() => {
    return [...shiftTypes]
      .sort((a, b) => {
        const aName = a.fields.schichtart_name || ""
        const bName = b.fields.schichtart_name || ""
        return aName.localeCompare(bName, "de")
      })
      .slice(0, 4)
  }, [shiftTypes])

  const nextShiftLabel = useMemo(() => {
    if (!nextShift) return "Noch keine Schicht geplant"
    const employeeId = extractRecordId(
      nextShift.shift.fields.zuweisung_mitarbeiter
    )
    const companyId = extractRecordId(
      nextShift.shift.fields.zuweisung_unternehmen
    )
    const shiftTypeId = extractRecordId(
      nextShift.shift.fields.zuweisung_schichtart
    )

    const employeeName = formatEmployeeName(
      employeeId ? employeeMap.get(employeeId) : undefined
    )
    const companyName = formatCompanyName(
      companyId ? companyMap.get(companyId) : undefined
    )
    const shiftTypeName = formatShiftTypeName(
      shiftTypeId ? shiftTypeMap.get(shiftTypeId) : undefined
    )

    return `${format(nextShift.dateTime, "dd.MM.yyyy")} · ${formatShiftTimeRange(
      nextShift.shift
    )} · ${employeeName} · ${companyName} · ${shiftTypeName}`
  }, [companyMap, employeeMap, nextShift, shiftTypeMap])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    if (!formState.date) {
      setFormError("Bitte ein Datum auswählen.")
      return
    }
    if (!formState.employeeId || !formState.companyId || !formState.shiftTypeId) {
      setFormError("Bitte Mitarbeiter, Unternehmen und Schichtart auswählen.")
      return
    }

    const fields: CreateSchichteinteilung = {
      zuweisung_datum: formState.date,
      zuweisung_beginn: formState.start || undefined,
      zuweisung_ende: formState.end || undefined,
      zuweisung_notiz: formState.note || undefined,
      zuweisung_mitarbeiter: createRecordUrl(
        APP_IDS.MITARBEITERVERWALTUNG,
        formState.employeeId
      ),
      zuweisung_unternehmen: createRecordUrl(
        APP_IDS.UNTERNEHMENSVERWALTUNG,
        formState.companyId
      ),
      zuweisung_schichtart: createRecordUrl(
        APP_IDS.SCHICHTARTENVERWALTUNG,
        formState.shiftTypeId
      ),
    }

    setIsSubmitting(true)
    try {
      await LivingAppsService.createSchichteinteilungEntry(fields)
      toast.success("Schicht gespeichert", {
        description: "Die Schichteinteilung wurde erfolgreich angelegt.",
      })
      setIsDialogOpen(false)
      setFormState(emptyFormState)
      await loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler"
      setFormError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at top left, hsl(186 55% 35% / 0.08), transparent 55%), linear-gradient(hsl(210 20% 88% / 0.35) 1px, transparent 1px), linear-gradient(90deg, hsl(210 20% 88% / 0.35) 1px, transparent 1px)",
          backgroundSize: "100% 100%, 28px 28px, 28px 28px",
        }}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-28 pt-8 md:pb-12 md:pt-10">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Planungshub
            </p>
            <h1 className="text-3xl font-semibold md:text-4xl">Schichtplaner</h1>
            <p className="text-sm text-muted-foreground">
              Nächste 7 Tage · {format(today, "dd.MM")} – {format(weekEnd, "dd.MM")}
            </p>
          </div>
          <Button
            className="hidden min-w-[200px] items-center gap-2 transition-transform active:scale-[0.98] md:inline-flex"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="size-4" />
            Schicht zuweisen
          </Button>
        </header>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>Fehler beim Laden</AlertTitle>
            <AlertDescription>
              <p>Die Daten konnten nicht geladen werden. Bitte erneut versuchen.</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 transition-transform active:scale-[0.98]"
                onClick={loadData}
              >
                Erneut versuchen
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-6 md:grid-cols-12">
          <section className="md:col-span-8">
            <Card className="relative overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="pointer-events-none absolute -right-16 -top-16 size-40 rounded-full bg-accent/10" />
              <CardHeader className="relative">
                <CardTitle className="text-lg">Schichten nächste 7 Tage</CardTitle>
                <CardDescription>
                  Überblick über die kommende Woche und die nächste Schicht
                </CardDescription>
                <div className="absolute right-6 top-6">
                  <Badge className="bg-accent text-accent-foreground">
                    Heute: {loading ? "…" : shiftsToday.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-32" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                ) : (
                  <>
                    <div className="text-5xl font-semibold tracking-tight md:text-6xl">
                      {shiftsThisWeek.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Nächste Schicht: {nextShiftLabel}
                    </div>
                    <div className="relative mt-2">
                      <div className="h-px w-full bg-border/70" />
                      <div className="absolute inset-x-0 -top-1 flex justify-between">
                        {Array.from({ length: 7 }).map((_, index) => (
                          <span
                            key={`tick-${index}`}
                            className="h-2 w-px rounded-full bg-border/70"
                          />
                        ))}
                      </div>
                      <Badge className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground">
                        Heute
                      </Badge>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 md:hidden">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`kpi-skel-${index}`} className="h-20 w-40" />
                ))
              ) : (
                <>
                  <Card className="min-w-[160px] shrink-0 shadow-sm">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Mitarbeitende</p>
                        <p className="text-2xl font-semibold">{employees.length}</p>
                      </div>
                      <Users className="size-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                  <Card className="min-w-[160px] shrink-0 shadow-sm">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Unternehmen</p>
                        <p className="text-2xl font-semibold">{companies.length}</p>
                      </div>
                      <Building2 className="size-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                  <Card className="min-w-[160px] shrink-0 shadow-sm">
                    <CardContent className="flex items-center justify-between py-4">
                      <div>
                        <p className="text-xs text-muted-foreground">Schichtarten</p>
                        <p className="text-2xl font-semibold">{shiftTypes.length}</p>
                      </div>
                      <Layers3 className="size-5 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </section>

          <section className="hidden md:col-span-4 md:grid md:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={`kpi-${index}`} className="h-24 w-full" />
              ))
            ) : (
              <>
                <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-5">
                    <div>
                      <p className="text-xs text-muted-foreground">Mitarbeitende</p>
                      <p className="text-2xl font-semibold">{employees.length}</p>
                    </div>
                    <Users className="size-6 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-5">
                    <div>
                      <p className="text-xs text-muted-foreground">Unternehmen</p>
                      <p className="text-2xl font-semibold">{companies.length}</p>
                    </div>
                    <Building2 className="size-6 text-muted-foreground" />
                  </CardContent>
                </Card>
                <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-5">
                    <div>
                      <p className="text-xs text-muted-foreground">Schichtarten</p>
                      <p className="text-2xl font-semibold">{shiftTypes.length}</p>
                    </div>
                    <Layers3 className="size-6 text-muted-foreground" />
                  </CardContent>
                </Card>
              </>
            )}
          </section>

          <section className="md:col-span-8">
            <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <CardHeader>
                <CardTitle>Schichten pro Tag (14 Tage)</CardTitle>
                <CardDescription>
                  Verlauf der Schichtlast für die kommenden zwei Wochen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-56 w-full" />
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Chart nicht verfügbar</AlertTitle>
                    <AlertDescription>
                      <p>Daten konnten nicht geladen werden.</p>
                    </AlertDescription>
                  </Alert>
                ) : chartData.every((entry) => entry.count === 0) ? (
                  <Empty className="border-dashed">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CalendarClock className="size-5" />
                      </EmptyMedia>
                      <EmptyTitle>Noch keine Schichten</EmptyTitle>
                      <EmptyDescription>
                        Lege die erste Schichteinteilung an, um den Verlauf zu sehen.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button
                        className="transition-transform active:scale-[0.98]"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Schicht zuweisen
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  <div className="h-56 md:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ left: -10, right: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="dateLabel"
                          interval={0}
                          tickFormatter={(value, index) =>
                            isMobile && index % 2 === 1 ? "" : value
                          }
                          tickMargin={8}
                        />
                        <YAxis allowDecimals={false} tickMargin={8} />
                        <Tooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            return (
                              <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg">
                                <div className="font-medium">Schichten</div>
                                <div>{payload[0]?.value}</div>
                              </div>
                            )
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke={chartAccent}
                          fill={chartAccent}
                          fillOpacity={0.2}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="md:col-span-4">
            <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-250">
              <CardHeader>
                <CardTitle>Unternehmen</CardTitle>
                <CardDescription>Standorte und Firmen im Überblick</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={`company-${index}`} className="h-16 w-full" />
                  ))
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Unternehmen nicht verfügbar</AlertTitle>
                    <AlertDescription>
                      <p>Daten konnten nicht geladen werden.</p>
                    </AlertDescription>
                  </Alert>
                ) : companiesSorted.length === 0 ? (
                  <Empty className="border-dashed">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <Building2 className="size-5" />
                      </EmptyMedia>
                      <EmptyTitle>Noch keine Unternehmen</EmptyTitle>
                      <EmptyDescription>
                        Lege zuerst ein Unternehmen an, um Schichten zuzuweisen.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  companiesSorted.map((company) => {
                    const street = company.fields.unternehmen_strasse || ""
                    const houseNumber = company.fields.unternehmen_hausnummer || ""
                    const plz = company.fields.unternehmen_plz || ""
                    const city = company.fields.unternehmen_ort || ""
                    const addressLine = [street, houseNumber]
                      .filter(Boolean)
                      .join(" ")
                    const locationLine = [plz, city].filter(Boolean).join(" ")

                    return (
                      <div
                        key={company.record_id}
                        className="rounded-lg border border-transparent p-3 transition hover:bg-muted/60"
                      >
                        <p className="font-medium">
                          {company.fields.unternehmen_name || "Unbenannt"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {locationLine || "Ort offen"}
                        </p>
                        {addressLine ? (
                          <p className="text-xs text-muted-foreground">
                            {addressLine}
                          </p>
                        ) : null}
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </section>

          <section className="md:col-span-8">
            <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <CardHeader>
                <CardTitle>Anstehende Schichten</CardTitle>
                <CardDescription>
                  Datum, Zeiten, Mitarbeitende und Schichtarten im Überblick
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={`shift-${index}`} className="h-16 w-full" />
                  ))
                ) : error ? (
                  <Alert variant="destructive">
                    <AlertTitle>Schichten nicht verfügbar</AlertTitle>
                    <AlertDescription>
                      <p>Daten konnten nicht geladen werden.</p>
                    </AlertDescription>
                  </Alert>
                ) : upcomingShifts.length === 0 ? (
                  <Empty className="border-dashed">
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <CalendarClock className="size-5" />
                      </EmptyMedia>
                      <EmptyTitle>Noch keine Schichten geplant</EmptyTitle>
                      <EmptyDescription>
                        Starte mit der ersten Schichteinteilung für dein Team.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button
                        className="transition-transform active:scale-[0.98]"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        Schicht zuweisen
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  upcomingShifts.map((shift) => {
                    const employeeId = extractRecordId(
                      shift.fields.zuweisung_mitarbeiter
                    )
                    const companyId = extractRecordId(
                      shift.fields.zuweisung_unternehmen
                    )
                    const shiftTypeId = extractRecordId(
                      shift.fields.zuweisung_schichtart
                    )

                    const employeeName = formatEmployeeName(
                      employeeId ? employeeMap.get(employeeId) : undefined
                    )
                    const companyName = formatCompanyName(
                      companyId ? companyMap.get(companyId) : undefined
                    )
                    const shiftTypeName = formatShiftTypeName(
                      shiftTypeId ? shiftTypeMap.get(shiftTypeId) : undefined
                    )
                    const dateValue = safeParseDate(
                      shift.fields.zuweisung_datum
                    )
                    const dateLabel = dateValue
                      ? format(dateValue, "dd.MM.yyyy")
                      : "Datum offen"
                    const timeLabel = formatShiftTimeRange(shift)

                    return (
                      <button
                        key={shift.record_id}
                        type="button"
                        onClick={() => setSelectedShift(shift)}
                        className="group w-full rounded-lg border border-transparent p-3 text-left transition hover:bg-muted/60 hover:shadow-sm transition-transform active:scale-[0.98]"
                      >
                        <div className="grid gap-2 md:grid-cols-[110px_1fr_auto] md:items-center">
                          <div className="text-sm font-medium text-foreground">
                            {dateLabel}
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-semibold">
                                {timeLabel}
                              </span>
                              <span className="text-sm text-foreground">
                                {employeeName}
                              </span>
                              {shift.fields.zuweisung_notiz ? (
                                <Badge variant="secondary">Notiz</Badge>
                              ) : null}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {companyName} · {shiftTypeName}
                            </p>
                          </div>
                          <ChevronRight className="ml-auto size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                        </div>
                      </button>
                    )
                  })
                )}
              </CardContent>
            </Card>
          </section>

          <section className="md:col-span-4">
            <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-350">
              <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle>Mitarbeitende</CardTitle>
                  <CardDescription>Schnellkontakt für Rückfragen</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={`emp-${index}`} className="h-14 w-full" />
                    ))
                  ) : error ? (
                    <Alert variant="destructive">
                      <AlertTitle>Mitarbeitende nicht verfügbar</AlertTitle>
                      <AlertDescription>
                        <p>Daten konnten nicht geladen werden.</p>
                      </AlertDescription>
                    </Alert>
                  ) : employeesSorted.length === 0 ? (
                    <Empty className="border-dashed">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Users className="size-5" />
                        </EmptyMedia>
                        <EmptyTitle>Noch kein Team</EmptyTitle>
                        <EmptyDescription>
                          Lege Mitarbeitende an, um Schichten zuzuweisen.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    employeesSorted.map((employee) => {
                      const name = formatEmployeeName(employee)
                      const contact =
                        employee.fields.mitarbeiter_email ||
                        employee.fields.mitarbeiter_telefon ||
                        "Kontakt offen"

                      return (
                        <div
                          key={employee.record_id}
                          className="rounded-lg border border-transparent p-3 transition hover:bg-muted/60"
                        >
                          <p className="font-medium">{name}</p>
                          <p className="text-xs text-muted-foreground">
                            {contact}
                          </p>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm transition-shadow duration-300 hover:shadow-md">
                <CardHeader>
                  <CardTitle>Schichtarten</CardTitle>
                  <CardDescription>Verfügbare Zeitfenster</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, index) => (
                      <Skeleton key={`shift-type-${index}`} className="h-14 w-full" />
                    ))
                  ) : error ? (
                    <Alert variant="destructive">
                      <AlertTitle>Schichtarten nicht verfügbar</AlertTitle>
                      <AlertDescription>
                        <p>Daten konnten nicht geladen werden.</p>
                      </AlertDescription>
                    </Alert>
                  ) : shiftTypesSorted.length === 0 ? (
                    <Empty className="border-dashed">
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Layers3 className="size-5" />
                        </EmptyMedia>
                        <EmptyTitle>Noch keine Schichtarten</EmptyTitle>
                        <EmptyDescription>
                          Definiere Schichtarten, um schneller planen zu können.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    shiftTypesSorted.map((shiftType) => {
                      const range = `${
                        shiftType.fields.schichtart_beginn || "offen"
                      } – ${shiftType.fields.schichtart_ende || "offen"}`

                      return (
                        <div
                          key={shiftType.record_id}
                          className="rounded-lg border border-transparent p-3 transition hover:bg-muted/60"
                        >
                          <p className="font-medium">
                            {shiftType.fields.schichtart_name || "Unbenannt"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {range}
                          </p>
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </div>

      <div
        className="fixed bottom-4 left-4 right-4 z-40 md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <Button
          className="w-full gap-2 transition-transform active:scale-[0.98]"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus className="size-4" />
          Schicht zuweisen
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Schicht zuweisen</DialogTitle>
            <DialogDescription>
              Lege Datum, Zeiten und Mitarbeitende für die neue Schicht fest.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shift-date">Datum</Label>
              <Input
                id="shift-date"
                type="date"
                value={formState.date}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    date: event.target.value,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="shift-start">Beginn</Label>
                <Input
                  id="shift-start"
                  type="time"
                  value={formState.start}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      start: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="shift-end">Ende</Label>
                <Input
                  id="shift-end"
                  type="time"
                  value={formState.end}
                  onChange={(event) =>
                    setFormState((prev) => ({
                      ...prev,
                      end: event.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Mitarbeiter auswählen</Label>
              <Select
                value={formState.employeeId || undefined}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, employeeId: value }))
                }
                disabled={employees.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      employees.length
                        ? "Mitarbeiter auswählen"
                        : "Keine Mitarbeitenden vorhanden"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.length ? (
                    employees.map((employee) => (
                      <SelectItem
                        key={employee.record_id}
                        value={employee.record_id}
                      >
                        {formatEmployeeName(employee)}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-employees" disabled>
                      Keine Mitarbeitenden vorhanden
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Unternehmen auswählen</Label>
              <Select
                value={formState.companyId || undefined}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, companyId: value }))
                }
                disabled={companies.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      companies.length
                        ? "Unternehmen auswählen"
                        : "Keine Unternehmen vorhanden"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {companies.length ? (
                    companies.map((company) => (
                      <SelectItem
                        key={company.record_id}
                        value={company.record_id}
                      >
                        {company.fields.unternehmen_name || "Unbenannt"}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-companies" disabled>
                      Keine Unternehmen vorhanden
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Schichtart auswählen</Label>
              <Select
                value={formState.shiftTypeId || undefined}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, shiftTypeId: value }))
                }
                disabled={shiftTypes.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      shiftTypes.length
                        ? "Schichtart auswählen"
                        : "Keine Schichtarten vorhanden"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {shiftTypes.length ? (
                    shiftTypes.map((shiftType) => (
                      <SelectItem
                        key={shiftType.record_id}
                        value={shiftType.record_id}
                      >
                        {shiftType.fields.schichtart_name || "Unbenannt"}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-shift-types" disabled>
                      Keine Schichtarten vorhanden
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="shift-note">Notiz</Label>
              <Textarea
                id="shift-note"
                rows={3}
                value={formState.note}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    note: event.target.value,
                  }))
                }
                placeholder="Optional: Hinweise zur Schicht"
              />
            </div>
            {formError ? (
              <Alert variant="destructive">
                <AlertTitle>Speichern nicht möglich</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="transition-transform active:scale-[0.98]"
              >
                {isSubmitting ? "Speichern..." : "Schicht speichern"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedShift}
        onOpenChange={(open) => {
          if (!open) setSelectedShift(null)
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Schichtdetails</DialogTitle>
            <DialogDescription>
              Alle Details zur ausgewählten Schicht auf einen Blick.
            </DialogDescription>
          </DialogHeader>
          {selectedShift ? (
            <div className="grid gap-4 text-sm">
              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground">Datum</p>
                <p className="font-medium">
                  {safeParseDate(selectedShift.fields.zuweisung_datum)
                    ? format(
                        safeParseDate(selectedShift.fields.zuweisung_datum)!,
                        "dd.MM.yyyy"
                      )
                    : "Datum offen"}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground">Zeit</p>
                <p className="font-medium">
                  {formatShiftTimeRange(selectedShift)}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground">Mitarbeiter</p>
                <p className="font-medium">
                  {formatEmployeeName(
                    (() => {
                      const id = extractRecordId(
                        selectedShift.fields.zuweisung_mitarbeiter
                      )
                      return id ? employeeMap.get(id) : undefined
                    })()
                  )}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground">Unternehmen</p>
                <p className="font-medium">
                  {formatCompanyName(
                    (() => {
                      const id = extractRecordId(
                        selectedShift.fields.zuweisung_unternehmen
                      )
                      return id ? companyMap.get(id) : undefined
                    })()
                  )}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground">Schichtart</p>
                <p className="font-medium">
                  {formatShiftTypeName(
                    (() => {
                      const id = extractRecordId(
                        selectedShift.fields.zuweisung_schichtart
                      )
                      return id ? shiftTypeMap.get(id) : undefined
                    })()
                  )}
                </p>
              </div>
              <div className="grid gap-1">
                <p className="text-xs text-muted-foreground">Notiz</p>
                <p className="font-medium">
                  {selectedShift.fields.zuweisung_notiz || "Keine Notiz"}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors />
    </div>
  )
}

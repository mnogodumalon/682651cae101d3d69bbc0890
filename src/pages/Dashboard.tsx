import { useEffect, useMemo, useState } from 'react'
import {
  LivingAppsService,
  extractRecordId,
} from '@/services/livingAppsService'

import type {
  Schichteinteilung,
  Schichtartenverwaltung,
} from '@/types/app'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { Skeleton } from '@/components/ui/skeleton'

import {
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from '@/components/ui/chart'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

import {
  format,
  isToday,
  parseISO,
  addDays,
  isWithinInterval,
  subDays,
} from 'date-fns'

import design from '@/../design_spec.json'

// Colors from design specification
const COLORS = design.colors

function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [shifts, setShifts] = useState<Schichteinteilung[]>([])
  const [shiftTypesMap, setShiftTypesMap] = useState<Record<string, string>>({})

  useEffect(() => {
    async function fetchData() {
      try {
        const [shiftData, shiftTypes] = await Promise.all([
          LivingAppsService.getSchichteinteilung(),
          LivingAppsService.getSchichtartenverwaltung(),
        ])

        setShifts(shiftData)

        const map: Record<string, string> = {}
        shiftTypes.forEach((t: Schichtartenverwaltung) => {
          map[t.record_id] = t.fields.schichtart_name || 'Unbenannt'
        })
        setShiftTypesMap(map)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  /**
   * KPI Berechnungen
   */
  const today = new Date()

  const kpi = useMemo(() => {
    if (!shifts.length) {
      return {
        totalToday: 0,
        next7Days: 0,
        employeesToday: 0,
      }
    }

    const totalToday = shifts.filter((s) => {
      const dateStr = s.fields.zuweisung_datum
      if (!dateStr) return false
      return isToday(parseISO(dateStr))
    }).length

    const next7Days = shifts.filter((s) => {
      const dateStr = s.fields.zuweisung_datum
      if (!dateStr) return false
      const date = parseISO(dateStr)
      return isWithinInterval(date, { start: today, end: addDays(today, 7) })
    }).length

    const employeesSet = new Set<string>()
    shifts.forEach((s) => {
      const dateStr = s.fields.zuweisung_datum
      if (!dateStr || !isToday(parseISO(dateStr))) return
      const employeeUrl = s.fields.zuweisung_mitarbeiter
      const id = extractRecordId(employeeUrl) || 'unknown'
      employeesSet.add(id)
    })

    return {
      totalToday,
      next7Days,
      employeesToday: employeesSet.size,
    }
  }, [shifts, today])

  /**
   * Chart Daten
   */
  const shiftsPerDayData = useMemo(() => {
    const data: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i -= 1) {
      const date = subDays(today, i)
      const key = format(date, 'yyyy-MM-dd')
      const count = shifts.filter((s) => s.fields.zuweisung_datum === key).length
      data.push({ date: format(date, 'dd.MM'), count })
    }
    return data
  }, [shifts, today])

  const shiftTypeDistribution = useMemo(() => {
    const map: Record<string, number> = {}
    shifts.forEach((s) => {
      const typeUrl = s.fields.zuweisung_schichtart
      const id = extractRecordId(typeUrl) || 'unknown'
      map[id] = (map[id] || 0) + 1
    })
    return Object.entries(map).map(([id, count]) => ({
      shiftType: shiftTypesMap[id] || 'Unbekannt',
      count,
    }))
  }, [shifts, shiftTypesMap])

  const pieColors = Object.values({
    ...COLORS,
    fallback1: '#2563eb',
    fallback2: '#7c3aed',
    fallback3: '#10b981',
    fallback4: '#fbbf24',
  })

  if (loading) {
    return (
      <div className="grid gap-4 p-4">
        <Skeleton className="h-8" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Schichtplan Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Schichten heute</CardTitle>
            <CardDescription>Anzahl der heutigen Schichten</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold">{kpi.totalToday}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nächste 7 Tage</CardTitle>
            <CardDescription>Schichten in den kommenden 7 Tagen</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold">{kpi.next7Days}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mitarbeiter heute</CardTitle>
            <CardDescription>Eingeplante Mitarbeiter heute</CardDescription>
          </CardHeader>
          <CardContent>
            <span className="text-4xl font-bold">{kpi.employeesToday}</span>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 mt-8 grid-cols-1 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Schichten pro Tag (letzte 30 Tage)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shiftsPerDayData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Verteilung nach Schichtart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={shiftTypeDistribution}
                    dataKey="count"
                    nameKey="shiftType"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    label={(entry) => entry.shiftType}
                  >
                    {shiftTypeDistribution.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={pieColors[index % pieColors.length]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard

import React, { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Spinner } from '@/components/ui/spinner'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, isSameDay, parseISO, subDays, addDays, isAfter, isBefore } from 'date-fns'

import type {
  Schichteinteilung,
  Schichtartenverwaltung,
  Mitarbeiterverwaltung,
} from '@/types/app'

import { LivingAppsService, extractRecordId } from '@/services/livingAppsService'

// Color scheme taken from design_spec.json
const COLORS = ['#0d9488', '#0ea5e9', '#facc15', '#fb923c', '#a78bfa', '#f472b6']

interface StatCardProps {
  label: string
  value: number | string
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
        <CardDescription>{label}</CardDescription>
      </CardHeader>
    </Card>
  )
}

export default function Dashboard() {
  const [shifts, setShifts] = useState<Schichteinteilung[]>()
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>()
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [sh, st, emp] = await Promise.all([
          LivingAppsService.getSchichteinteilung(),
          LivingAppsService.getSchichtartenverwaltung(),
          LivingAppsService.getMitarbeiterverwaltung(),
        ])
        setShifts(sh)
        setShiftTypes(st)
        setEmployees(emp)
      } catch (err) {
        console.error('Error loading data', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = format(new Date(), 'yyyy-MM-dd')

  const stats = useMemo(() => {
    if (!shifts || !employees || !shiftTypes) return null

    const total_shifts = shifts.length
    const shifts_today = shifts.filter((s) =>
      s.fields.zuweisung_datum ? s.fields.zuweisung_datum === today : false
    ).length
    const employees_count = employees.length
    const shift_types_count = shiftTypes.length

    return {
      total_shifts,
      shifts_today,
      employees_count,
      shift_types_count,
    }
  }, [shifts, employees, shiftTypes, today])

  // Data for line chart (last 30 days)
  const lineData = useMemo(() => {
    if (!shifts) return []
    const startDate = subDays(new Date(), 29) // includes today
    const map: Record<string, number> = {}
    shifts.forEach((s) => {
      const dateStr = s.fields.zuweisung_datum
      if (!dateStr) return
      const dateObj = parseISO(dateStr)
      if (isBefore(dateObj, startDate) || isAfter(dateObj, new Date())) return
      const key = format(dateObj, 'yyyy-MM-dd')
      map[key] = (map[key] || 0) + 1
    })
    const dataArr: { date: string; value: number }[] = []
    for (let i = 0; i < 30; i++) {
      const date = addDays(startDate, i)
      const key = format(date, 'yyyy-MM-dd')
      dataArr.push({ date: key, value: map[key] || 0 })
    }
    return dataArr
  }, [shifts])

  // Data for pie chart (shift type distribution)
  const pieData = useMemo(() => {
    if (!shifts || !shiftTypes) return []
    const map: Record<string, number> = {}
    shifts.forEach((s) => {
      const typeUrl = s.fields.zuweisung_schichtart
      const typeId = extractRecordId(typeUrl)
      if (!typeId) return
      map[typeId] = (map[typeId] || 0) + 1
    })
    return shiftTypes.map((t) => ({
      name: t.fields.schichtart_name || 'Unbenannt',
      value: map[t.record_id] || 0,
    }))
  }, [shifts, shiftTypes])

  // Upcoming shifts next 7 days
  const upcomingShifts = useMemo(() => {
    if (!shifts) return []
    const todayDate = new Date()
    const endDate = addDays(todayDate, 7)

    return shifts
      .filter((s) => {
        if (!s.fields.zuweisung_datum) return false
        const d = parseISO(s.fields.zuweisung_datum)
        return (isAfter(d, todayDate) || isSameDay(d, todayDate)) && isBefore(d, addDays(endDate, 1))
      })
      .sort((a, b) => {
        if (!a.fields.zuweisung_datum || !b.fields.zuweisung_datum) return 0
        return a.fields.zuweisung_datum.localeCompare(b.fields.zuweisung_datum)
      })
      .slice(0, 10) // limit rows
  }, [shifts])

  const employeeNameById = useMemo(() => {
    if (!employees) return {}
    const map: Record<string, string> = {}
    employees.forEach((e) => {
      map[e.record_id] = `${e.fields.mitarbeiter_vorname || ''} ${e.fields.mitarbeiter_nachname || ''}`.trim()
    })
    return map
  }, [employees])

  const shiftTypeNameById = useMemo(() => {
    if (!shiftTypes) return {}
    const map: Record<string, string> = {}
    shiftTypes.forEach((st) => {
      map[st.record_id] = st.fields.schichtart_name || 'Unbenannt'
    })
    return map
  }, [shiftTypes])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner className="size-8" />
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen flex flex-col gap-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Gesamtanzahl Schichten" value={stats.total_shifts} />
        <StatCard label="Schichten heute" value={stats.shifts_today} />
        <StatCard label="Mitarbeitende" value={stats.employees_count} />
        <StatCard label="Schichtarten" value={stats.shift_types_count} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Schichten pro Tag (letzte 30 Tage)</CardTitle>
            <CardDescription>Zeitlicher Verlauf der Anzahl Schichten</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(d) => format(parseISO(d), 'dd.MM')} />
                <YAxis allowDecimals={false} />
                <Tooltip labelFormatter={(d) => format(parseISO(String(d)), 'PPP')} />
                <Line type="monotone" dataKey="value" stroke="#0d9488" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Verteilung der Schichtarten</CardTitle>
            <CardDescription>Anteil nach Schichtart</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie dataKey="value" data={pieData} outerRadius={100} label={({ name }) => name}>
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Shifts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Anstehende Schichten (nächste 7 Tage)</CardTitle>
          <CardDescription>Maximal 10 Einträge</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead>Mitarbeiter</TableHead>
                <TableHead>Schichtart</TableHead>
                <TableHead>Beginn</TableHead>
                <TableHead>Ende</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingShifts.map((s) => {
                const empId = extractRecordId(s.fields.zuweisung_mitarbeiter)
                const typeId = extractRecordId(s.fields.zuweisung_schichtart)
                return (
                  <TableRow key={s.record_id}>
                    <TableCell>{s.fields.zuweisung_datum}</TableCell>
                    <TableCell>{empId ? employeeNameById[empId] : '—'}</TableCell>
                    <TableCell>{typeId ? shiftTypeNameById[typeId] : '—'}</TableCell>
                    <TableCell>{s.fields.zuweisung_beginn || '—'}</TableCell>
                    <TableCell>{s.fields.zuweisung_ende || '—'}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

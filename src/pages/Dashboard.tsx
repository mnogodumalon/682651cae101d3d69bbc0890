import React, { useEffect, useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  LivingAppsService,
  extractRecordId,
} from '@/services/livingAppsService';

import type {
  Schichteinteilung,
  Schichtartenverwaltung,
  Mitarbeiterverwaltung,
} from '@/types/app';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

import {
  startOfToday,
  addDays,
  format as formatDate,
  isSameDay,
  parseISO,
} from 'date-fns';

// --------------------------
// Types for local state
// --------------------------

type KPI = {
  totalShiftsToday: number;
  coverageToday: number; // 0..1 fraction
  employeesScheduledToday: number;
};

// --------------------------
// Color palette (matches design_spec.json)
// --------------------------
const COLORS = {
  primary: '#2E86AB',
  secondary: '#E84855',
  accent: '#FDBB30',
};

// --------------------------
// Component
// --------------------------

export default function Dashboard() {
  const isMobile = useIsMobile();

  const [shifts, setShifts] = useState<Schichteinteilung[]>([]);
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([]);
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [shiftsData, shiftTypesData, employeesData] = await Promise.all([
          LivingAppsService.getSchichteinteilung(),
          LivingAppsService.getSchichtartenverwaltung(),
          LivingAppsService.getMitarbeiterverwaltung(),
        ]);
        setShifts(shiftsData);
        setShiftTypes(shiftTypesData);
        setEmployees(employeesData);
      } catch (err: any) {
        setError(err.message || 'Unbekannter Fehler');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --------------------
  // Helper maps
  // --------------------
  const shiftTypeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    shiftTypes.forEach((s) => {
      map[s.record_id] = s.fields.schichtart_name || 'Unbenannt';
    });
    return map;
  }, [shiftTypes]);

  const employeeNameById = useMemo(() => {
    const map: Record<string, string> = {};
    employees.forEach((e) => {
      map[e.record_id] = `${e.fields.mitarbeiter_vorname || ''} ${e.fields.mitarbeiter_nachname || ''}`.trim() ||
        'Unbekannt';
    });
    return map;
  }, [employees]);

  // --------------------
  // KPI Calculations
  // --------------------
  const kpi: KPI = useMemo(() => {
    const today = startOfToday();
    const shiftsToday = shifts.filter((s) => {
      if (!s.fields.zuweisung_datum) return false;
      return isSameDay(parseISO(s.fields.zuweisung_datum), today);
    });

    const total = shiftsToday.length;
    const withEmployee = shiftsToday.filter((s) => !!extractRecordId(s.fields.zuweisung_mitarbeiter)).length;
    const uniqueEmployees = new Set(
      shiftsToday.map((s) => extractRecordId(s.fields.zuweisung_mitarbeiter)).filter(Boolean) as string[],
    );

    return {
      totalShiftsToday: total,
      coverageToday: total === 0 ? 0 : withEmployee / total,
      employeesScheduledToday: uniqueEmployees.size,
    };
  }, [shifts]);

  // --------------------
  // Chart datasets
  // --------------------
  const { shiftsPerDayData, shiftTypeDistributionData, employeeLoadData } = useMemo(() => {
    const today = startOfToday();
    const next7days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

    // Helper arrays for counting
    const shiftsPerDay: { date: string; count: number }[] = next7days.map((d) => ({
      date: formatDate(d, 'dd.MM'),
      count: 0,
    }));

    const shiftTypeCounts: Record<string, number> = {};
    const employeeCounts: Record<string, number> = {};

    shifts.forEach((shift) => {
      if (!shift.fields.zuweisung_datum) return;
      const shiftDate = parseISO(shift.fields.zuweisung_datum);
      const daysDiff = Math.floor((shiftDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 0 || daysDiff > 6) return; // not in next 7 days

      // shifts per day
      shiftsPerDay[daysDiff].count += 1;

      // shift type distribution
      const shiftTypeId = extractRecordId(shift.fields.zuweisung_schichtart);
      if (shiftTypeId) {
        shiftTypeCounts[shiftTypeId] = (shiftTypeCounts[shiftTypeId] || 0) + 1;
      }

      // employee load
      const employeeId = extractRecordId(shift.fields.zuweisung_mitarbeiter);
      if (employeeId) {
        employeeCounts[employeeId] = (employeeCounts[employeeId] || 0) + 1;
      }
    });

    const shiftTypeDistribution = Object.entries(shiftTypeCounts).map(([id, count]) => ({
      shiftType: shiftTypeNameById[id] || 'Unbekannt',
      count,
    }));

    const employeeLoad = Object.entries(employeeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10) // Top 10 for readability
      .map(([id, count]) => ({
        employee: employeeNameById[id] || 'Unbekannt',
        count,
      }));

    return {
      shiftsPerDayData: shiftsPerDay,
      shiftTypeDistributionData: shiftTypeDistribution,
      employeeLoadData: employeeLoad,
    };
  }, [shifts, shiftTypeNameById, employeeNameById]);

  // --------------------
  // Render helpers
  // --------------------

  const renderKpiCards = () => (
    <>
      <Card style={{ gridArea: 'kpi1' }}>
        <CardHeader>
          <CardTitle>Schichten heute</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold text-primary-foreground" data-testid="kpi-total-shifts">
            {kpi.totalShiftsToday}
          </p>
        </CardContent>
      </Card>

      <Card style={{ gridArea: 'kpi2' }}>
        <CardHeader>
          <CardTitle>Abdeckung heute</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold" data-testid="kpi-coverage">
            {Math.round(kpi.coverageToday * 100)}%
          </p>
        </CardContent>
      </Card>

      <Card style={{ gridArea: 'kpi3' }}>
        <CardHeader>
          <CardTitle>Mitarbeiter im Einsatz</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold" data-testid="kpi-employees">
            {kpi.employeesScheduledToday}
          </p>
        </CardContent>
      </Card>
    </>
  );

  const renderCharts = () => (
    <>
      {/* Shifts per day */}
      <Card style={{ gridArea: 'chart1' }}>
        <CardHeader>
          <CardTitle>Schichten pro Tag (7 Tage)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={shiftsPerDayData}>
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.primary} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Shift type distribution */}
      <Card style={{ gridArea: 'chart2' }}>
        <CardHeader>
          <CardTitle>Verteilung Schichtarten (7 Tage)</CardTitle>
        </CardHeader>
        <CardContent className="h-72 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="count"
                nameKey="shiftType"
                data={shiftTypeDistributionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {shiftTypeDistributionData.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index % 2 === 0 ? COLORS.primary : COLORS.secondary}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Employee load */}
      <Card style={{ gridArea: 'chart3' }}>
        <CardHeader>
          <CardTitle>Schichten pro Mitarbeiter (Top 10, 7 Tage)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={employeeLoadData} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="employee" type="category" width={150} />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.accent} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );

  // --------------------
  // Main render
  // --------------------
  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <span>Lade Daten...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center text-red-600">
        Fehler: {error}
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col gap-6 p-4">
        {renderKpiCards()}
        {renderCharts()}
      </div>
    );
  }

  // Desktop layout using CSS grid areas
  return (
    <div
      className="grid gap-6 p-6"
      style={{
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateAreas: `"kpi1 kpi2 kpi3" "chart1 chart2 chart3"`,
      }}
    >
      {renderKpiCards()}
      {renderCharts()}
    </div>
  );
}

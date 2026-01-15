import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, isSameWeek, parseISO, startOfToday, addDays } from "date-fns";
import { de } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ProgressRing";
import { LivingAppsService, extractRecordId } from "@/services/livingAppsService";
import type {
  Schichteinteilung,
  Schichtartenverwaltung,
  Mitarbeiterverwaltung,
} from "@/types/app";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  ResponsiveContainer,
} from "recharts";

import { cn } from "@/lib/utils";

function useDashboardData() {
  const [shifts, setShifts] = useState<Schichteinteilung[]>([]);
  const [employees, setEmployees] = useState<Mitarbeiterverwaltung[]>([]);
  const [shiftTypes, setShiftTypes] = useState<Schichtartenverwaltung[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [s, e, st] = await Promise.all([
          LivingAppsService.getSchichteinteilung(),
          LivingAppsService.getMitarbeiterverwaltung(),
          LivingAppsService.getSchichtartenverwaltung(),
        ]);
        setShifts(s);
        setEmployees(e);
        setShiftTypes(st);
      } catch (err: any) {
        setError(err.message || "Fehler beim Laden der Daten");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = startOfToday();

  const shiftsToday = useMemo(
    () => shifts.filter((s) => {
      const dateStr = s.fields.zuweisung_datum;
      if (!dateStr) return false;
      // YYYY-MM-DD
      const date = parseISO(dateStr);
      return isSameDay(date, today);
    }),
    [shifts]
  );

  const shiftsThisWeek = useMemo(
    () => shifts.filter((s) => {
      const dateStr = s.fields.zuweisung_datum;
      if (!dateStr) return false;
      const date = parseISO(dateStr);
      return isSameWeek(date, today, { weekStartsOn: 1 });
    }),
    [shifts]
  );

  const barChartData = useMemo(() => {
    const arr: { date: string; count: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(today, i);
      const count = shifts.filter((s) => {
        const dateStr = s.fields.zuweisung_datum;
        if (!dateStr) return false;
        const date = parseISO(dateStr);
        return isSameDay(date, d);
      }).length;
      arr.push({ date: format(d, "EEE", { locale: de }), count });
    }
    return arr;
  }, [shifts]);

  const upcomingShifts = useMemo(() => {
    return [...shifts]
      .filter((s) => {
        const dateStr = s.fields.zuweisung_datum;
        return !!dateStr;
      })
      .sort((a, b) => {
        const da = parseISO(a.fields.zuweisung_datum!);
        const db = parseISO(b.fields.zuweisung_datum!);
        return da.getTime() - db.getTime();
      })
      .slice(0, 10);
  }, [shifts]);

  return {
    loading,
    error,
    shiftsTodayCount: shiftsToday.length,
    employeesCount: employees.length,
    shiftTypesCount: shiftTypes.length,
    shiftsWeekCount: shiftsThisWeek.length,
    progressPercentage:
      employees.length > 0 ? (shiftsToday.length / employees.length) * 100 : 0,
    barChartData,
    upcomingShifts,
    employees,
    shiftTypes,
  };
}

export default function Dashboard() {
  const isMobile = useIsMobile();
  const data = useDashboardData();

  if (data.loading) {
    return <div className="p-6">Lade...</div>;
  }
  if (data.error) {
    return <div className="p-6 text-destructive">{data.error}</div>;
  }

  return (
    <div
      className={cn(
        "w-full p-4 md:p-8",
        isMobile ? "space-y-6" : "grid grid-cols-12 gap-6"
      )}
    >
      {/* Hero KPI */}
      <Card
        className={cn(
          "flex items-center justify-center",
          isMobile ? "mx-auto" : "col-span-4 row-span-2"
        )}
      >
        <ProgressRing
          percentage={Math.min(100, Math.round(data.progressPercentage))}
        >
          <div className="text-5xl font-bold">
            {data.shiftsTodayCount}
          </div>
          <div className="text-muted-foreground text-sm mt-1">
            Schichten heute
          </div>
          <div className="text-xs text-muted-foreground">
            von {data.employeesCount} Mitarbeitern
          </div>
        </ProgressRing>
      </Card>

      {/* Bar Chart */}
      <Card className={cn(isMobile ? "" : "col-span-4 row-span-2")}>
        <CardHeader>
          <CardTitle>Schichten pro Tag (7 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64">
            <ResponsiveContainer>
              <BarChart data={data.barChartData}>
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <ReTooltip />
                <Bar dataKey="count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Secondary KPIs */}
      <div
        className={cn(
          isMobile
            ? "flex gap-4 overflow-x-auto pb-2"
            : "col-span-4 grid grid-cols-3 gap-4"
        )}
      >
        <KpiCard title="Mitarbeiter" value={data.employeesCount} />
        <KpiCard title="Schichtarten" value={data.shiftTypesCount} />
        <KpiCard title="Schichten Woche" value={data.shiftsWeekCount} />
      </div>

      {/* Upcoming shifts list */}
      <Card className={cn(isMobile ? "" : "col-span-4 row-span-2")}>
        <CardHeader>
          <CardTitle>Bevorstehende Schichten</CardTitle>
          <CardDescription>Nächste {isMobile ? 5 : 10} Einträge</CardDescription>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-border">
              {data.upcomingShifts.slice(0, isMobile ? 5 : 10).map((shift) => {
                const dateStr = shift.fields.zuweisung_datum || "";
                const date = dateStr ? parseISO(dateStr) : undefined;
                const employeeUrl = shift.fields.zuweisung_mitarbeiter;
                const empId = extractRecordId(employeeUrl || "");
                const emp = data.employees.find((e) => e.record_id === empId);
                const employeeName = emp
                  ? `${emp.fields.mitarbeiter_vorname || ""} ${
                      emp.fields.mitarbeiter_nachname || ""
                    }`.trim()
                  : "–";
                const shiftTypeUrl = shift.fields.zuweisung_schichtart;
                const stId = extractRecordId(shiftTypeUrl || "");
                const st = data.shiftTypes.find((s) => s.record_id === stId);
                const shiftTypeName = st?.fields.schichtart_name || "–";
                return (
                  <tr key={shift.record_id} className="hover:bg-muted/50">
                    <td className="py-2 pr-2 whitespace-nowrap font-medium">
                      {date ? format(date, "dd.MM", { locale: de }) : ""}
                    </td>
                    <td className="py-2 px-2">{employeeName}</td>
                    <td className="py-2 pl-2 text-muted-foreground">
                      {shiftTypeName}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* FAB / Primary Action */}
      {isMobile ? (
        <Button
          className="fixed bottom-6 right-6 rounded-full shadow-lg size-14 flex items-center justify-center"
          variant="default"
          size="icon-lg"
          onClick={() => alert("TODO: Schicht anlegen")}
        >
          +
        </Button>
      ) : (
        <div className="col-span-12 flex justify-end mt-4">
          <Button onClick={() => alert("TODO: Schicht anlegen")}>Schicht anlegen</Button>
        </div>
      )}
    </div>
  );
}

function KpiCard({ title, value }: { title: string; value: number }) {
  return (
    <Card className="min-w-[140px]">
      <CardHeader className="p-4">
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-bold">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}


import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, CheckCircle, XCircle, Clock, Users, TableProperties, Building2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import SchoolLayout from "@/components/shared/SchoolLayout";

type AttendanceStatus = "present" | "absent" | "late" | "excused";
type AttendanceType = "school" | "class";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; short: string; color: string; cell: string }> = {
  present: { label: "Present", short: "P", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", cell: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  absent:  { label: "Absent",  short: "A", color: "bg-red-500/20 text-red-400 border-red-500/30",           cell: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300" },
  late:    { label: "Late",    short: "L", color: "bg-amber-500/20 text-amber-400 border-amber-500/30",     cell: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  excused: { label: "Excused", short: "E", color: "bg-blue-500/20 text-blue-400 border-blue-500/30",       cell: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
};

// ─── Spreadsheet view ─────────────────────────────────────────────────────────
function AttendanceSpreadsheet({ classId }: { classId: number }) {
  const { data: students } = trpc.classes.students.useQuery({ classId });
  const { data: dates } = trpc.attendance.getDates.useQuery({ classId });

  const sortedDates = [...(dates ?? [])].sort();

  const [grid, setGrid] = useState<Record<number, Record<string, AttendanceStatus>>>({});

  const { data: allRecords } = trpc.attendance.getAllForClass.useQuery(
    { classId },
    { enabled: !!classId }
  );

  useEffect(() => {
    if (!allRecords) return;
    const map: Record<number, Record<string, AttendanceStatus>> = {};
    (allRecords as any[]).forEach((r: any) => {
      if (!map[r.studentId]) map[r.studentId] = {};
      map[r.studentId][r.date] = r.status as AttendanceStatus;
    });
    setGrid(map);
  }, [JSON.stringify(allRecords)]);

  const studentList = (students ?? []) as any[];

  if (sortedDates.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <TableProperties className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No attendance records yet. Take attendance first.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm font-sans border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/80 backdrop-blur px-4 py-3 text-left font-semibold text-foreground border-b border-r border-border min-w-[160px]">
              Student
            </th>
            {sortedDates.map((date) => (
              <th key={date} className="px-3 py-3 text-center font-medium text-muted-foreground border-b border-border min-w-[80px] whitespace-nowrap">
                {new Date(date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </th>
            ))}
            <th className="px-3 py-3 text-center font-semibold text-foreground border-b border-l border-border min-w-[80px]">
              Summary
            </th>
          </tr>
        </thead>
        <tbody>
          {studentList.map((student: any, idx: number) => {
            const studentGrid = grid[student.id] ?? {};
            const presentCount = sortedDates.filter((d) => studentGrid[d] === "present").length;
            const absentCount = sortedDates.filter((d) => studentGrid[d] === "absent").length;
            const lateCount = sortedDates.filter((d) => studentGrid[d] === "late").length;
            const total = sortedDates.filter((d) => studentGrid[d]).length;
            const attendanceRate = total > 0 ? Math.round((presentCount / total) * 100) : null;

            return (
              <tr key={student.id} className={cn("border-b border-border hover:bg-accent/20 transition-colors", idx % 2 === 0 ? "" : "bg-muted/20")}>
                <td className="sticky left-0 z-10 bg-background px-4 py-2.5 font-medium text-foreground border-r border-border">
                  {student.name ?? "—"}
                </td>
                {sortedDates.map((date) => {
                  const status = studentGrid[date] as AttendanceStatus | undefined;
                  return (
                    <td key={date} className="px-3 py-2.5 text-center">
                      {status ? (
                        <span className={cn("inline-block px-2 py-0.5 rounded-full text-xs font-bold", STATUS_CONFIG[status].cell)}>
                          {STATUS_CONFIG[status].short}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/30 text-xs">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-2.5 text-center border-l border-border">
                  <div className="flex flex-col items-center gap-0.5">
                    {attendanceRate !== null && (
                      <span className={cn(
                        "text-xs font-bold",
                        attendanceRate >= 90 ? "text-emerald-600" : attendanceRate >= 75 ? "text-amber-600" : "text-red-600"
                      )}>
                        {attendanceRate}%
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {presentCount}P {absentCount}A {lateCount}L
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 border-t border-border text-xs text-muted-foreground">
        <span className="font-semibold">Legend:</span>
        {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG[AttendanceStatus]][]).map(([key, cfg]) => (
          <span key={key} className="flex items-center gap-1">
            <span className={cn("inline-block px-1.5 py-0.5 rounded-full font-bold", cfg.cell)}>{cfg.short}</span>
            {cfg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function TeacherAttendance() {
  const today = new Date().toISOString().split("T")[0];
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(today);
  const [records, setRecords] = useState<Record<number, AttendanceStatus>>({});
  const [attendanceType, setAttendanceType] = useState<AttendanceType>("class");

  const { data: classes } = trpc.classes.myClasses.useQuery();
  const { data: students } = trpc.classes.students.useQuery(
    { classId: selectedClassId! },
    { enabled: !!selectedClassId }
  );
  const { data: existingAttendance } = trpc.attendance.getByClassDate.useQuery(
    { classId: selectedClassId!, date: selectedDate },
    { enabled: !!selectedClassId }
  );

  useEffect(() => {
    if (existingAttendance && existingAttendance.length > 0) {
      const map: Record<number, AttendanceStatus> = {};
      (existingAttendance as any[]).forEach((r: any) => { map[r.studentId] = r.status as AttendanceStatus; });
      setRecords(map);
    } else {
      setRecords({});
    }
  }, [JSON.stringify(existingAttendance), selectedClassId, selectedDate]);

  const utils = trpc.useUtils();
  const saveAttendance = trpc.attendance.mark.useMutation({
    onSuccess: () => {
      toast.success("Attendance saved!");
      utils.attendance.getByClassDate.invalidate();
      utils.attendance.getAllForClass.invalidate();
      utils.attendance.getDates.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const handleStatusChange = (studentId: number, status: AttendanceStatus) => {
    setRecords((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const allStudents = (students as any[]) ?? [];
    const map: Record<number, AttendanceStatus> = {};
    allStudents.forEach((s: any) => { map[s.id] = status; });
    setRecords(map);
  };

  const handleSave = () => {
    if (!selectedClassId) return;
    const allStudents = (students as any[]) ?? [];
    const recs = allStudents.map((s: any) => ({
      studentId: s.id,
      status: records[s.id] ?? "present",
    }));
    saveAttendance.mutate({ classId: selectedClassId, date: selectedDate, records: recs });
  };

  const allClasses = (classes ?? []) as any[];
  const studentList = (students ?? []) as any[];
  const presentCount = Object.values(records).filter((s) => s === "present").length;
  const absentCount = Object.values(records).filter((s) => s === "absent").length;
  const lateCount = Object.values(records).filter((s) => s === "late").length;

  return (
    <SchoolLayout role="teacher">
      <div className="space-y-6 p-6 max-w-6xl mx-auto">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Attendance</p>
          <h1 className="font-serif text-3xl font-bold text-foreground">Attendance Tracker</h1>
        </div>

        {/* Attendance Type Selector */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setAttendanceType("school")}
            className={cn(
              "p-4 rounded-xl border-2 transition-all text-left",
              attendanceType === "school"
                ? "border-blue-500 bg-blue-500/10"
                : "border-border hover:border-foreground/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5" />
              <span className="font-semibold">School Attendance</span>
            </div>
            <p className="text-xs text-muted-foreground">Did student come to school?</p>
          </button>
          <button
            onClick={() => setAttendanceType("class")}
            className={cn(
              "p-4 rounded-xl border-2 transition-all text-left",
              attendanceType === "class"
                ? "border-purple-500 bg-purple-500/10"
                : "border-border hover:border-foreground/30"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5" />
              <span className="font-semibold">Class Attendance</span>
            </div>
            <p className="text-xs text-muted-foreground">Came/Late/Excused/Absent</p>
          </button>
        </div>

        {/* Class selector */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1.5 flex-1 min-w-[180px]">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Class</label>
            <Select
              value={selectedClassId?.toString() ?? ""}
              onValueChange={(v) => { setSelectedClassId(parseInt(v, 10)); setRecords({}); }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a class…" />
              </SelectTrigger>
              <SelectContent>
                {allClasses.map((cls: any) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.parentId ? `  └ ${cls.name}` : cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedClassId && (
          <div className="rounded-xl border border-border p-12 text-center space-y-3">
            <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
            <p className="text-sm text-muted-foreground">Select a class to manage attendance.</p>
          </div>
        )}

        {selectedClassId && (
          <Tabs defaultValue="daily">
            <TabsList className="mb-4">
              <TabsTrigger value="daily" className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Daily Attendance
              </TabsTrigger>
              <TabsTrigger value="spreadsheet" className="flex items-center gap-1.5">
                <TableProperties className="w-3.5 h-3.5" /> History Spreadsheet
              </TabsTrigger>
            </TabsList>

            {/* ── Daily tab ── */}
            <TabsContent value="daily" className="space-y-5">
              <div className="flex flex-wrap gap-3 items-end">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-9 px-3 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>

              {studentList.length > 0 && (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="border-emerald-500/20 bg-emerald-500/5">
                      <CardContent className="p-4 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-emerald-400" />
                        <div>
                          <p className="text-2xl font-bold text-emerald-400">{presentCount}</p>
                          <p className="text-xs text-muted-foreground">Present</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-red-500/20 bg-red-500/5">
                      <CardContent className="p-4 flex items-center gap-3">
                        <XCircle className="w-8 h-8 text-red-400" />
                        <div>
                          <p className="text-2xl font-bold text-red-400">{absentCount}</p>
                          <p className="text-xs text-muted-foreground">Absent</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-amber-500/20 bg-amber-500/5">
                      <CardContent className="p-4 flex items-center gap-3">
                        <Clock className="w-8 h-8 text-amber-400" />
                        <div>
                          <p className="text-2xl font-bold text-amber-400">{lateCount}</p>
                          <p className="text-xs text-muted-foreground">Late</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick mark-all */}
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className="text-xs text-muted-foreground">Mark all as:</span>
                    {(attendanceType === "school" 
                      ? ["present", "absent"] 
                      : ["present", "absent", "late", "excused"]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleMarkAll(s as AttendanceStatus)}
                        className={`text-xs px-3 py-1 rounded-full border ${STATUS_CONFIG[s as AttendanceStatus].color} hover:opacity-80 transition-opacity`}
                      >
                        {STATUS_CONFIG[s as AttendanceStatus].label}
                      </button>
                    ))}
                  </div>

                  {/* Student list */}
                  <div className="space-y-2">
                    {studentList.map((student: any) => {
                      const status = records[student.id] ?? "present";
                      const statusOptions = attendanceType === "school" 
                        ? ["present", "absent"] 
                        : ["present", "absent", "late", "excused"];
                      
                      return (
                        <div key={student.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">
                              {(student.name ?? "?").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-foreground">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.email}</p>
                          </div>
                          <div className="flex gap-1.5 flex-wrap justify-end">
                            {statusOptions.map((s) => (
                              <button
                                key={s}
                                onClick={() => handleStatusChange(student.id, s as AttendanceStatus)}
                                className={cn(
                                  "text-xs px-2.5 py-1 rounded-full border transition-all",
                                  status === s ? STATUS_CONFIG[s as AttendanceStatus].color + " font-semibold" : "border-border text-muted-foreground hover:border-foreground/30"
                                )}
                              >
                                {STATUS_CONFIG[s as AttendanceStatus].label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSave}
                      disabled={saveAttendance.isPending}
                      className="px-8"
                    >
                      {saveAttendance.isPending ? "Saving…" : "Save Attendance"}
                    </Button>
                  </div>
                </>
              )}

              {studentList.length === 0 && (
                <div className="rounded-xl border border-border p-12 text-center space-y-3">
                  <Users className="w-10 h-10 text-muted-foreground/30 mx-auto" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground">No students in this class yet.</p>
                </div>
              )}
            </TabsContent>

            {/* ── Spreadsheet tab ── */}
            <TabsContent value="spreadsheet">
              <AttendanceSpreadsheet classId={selectedClassId} />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </SchoolLayout>
  );
}

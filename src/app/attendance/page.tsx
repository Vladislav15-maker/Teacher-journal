
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import type { Class, Lesson, Student } from '@/lib/types';
import { getClasses } from '@/actions/class-actions';
import { getStudents } from '@/actions/student-actions';
import { getLessonsForClass } from '@/actions/lesson-actions';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const COLORS = {
  present: 'hsl(var(--chart-2))',
  absent: 'hsl(var(--chart-1))',
  excused: 'hsl(var(--chart-4))',
};

type AttendanceKey = keyof typeof COLORS;

export default function AttendancePage() {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Omit<Class, 'students'>[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    const fetchClasses = async () => {
      setIsLoadingClasses(true);
      const data = await getClasses();
      setClasses(data);
      if (data.length > 0 && !selectedClassId) {
        setSelectedClassId(data[0].id);
      }
      setIsLoadingClasses(false);
    };
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;

    const fetchClassData = async () => {
      setIsLoadingData(true);
      
      const [studentsData, lessonsData] = await Promise.all([
        getStudents(selectedClassId),
        getLessonsForClass(
            selectedClassId, 
            startOfMonth(currentDate).toISOString(), 
            endOfMonth(currentDate).toISOString()
        )
      ]);
      
      setStudents(studentsData);
      setLessons(lessonsData);
      setIsLoadingData(false);
    };

    fetchClassData();
  }, [selectedClassId, currentDate]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  const attendanceData = useMemo(() => {
    if (!lessons || !students) return { overall: [], byStudent: [] };

    const overall: Record<AttendanceKey, number> = { present: 0, absent: 0, excused: 0 };
    const byStudent: { name: string; present: number; absent: number; excused: number }[] = students.map(s => ({
      name: `${s.firstName} ${s.lastName.charAt(0)}.`,
      present: 0,
      absent: 0,
      excused: 0
    }));

    lessons.forEach(lesson => {
      (lesson.records || []).forEach(record => {
        if (record.attendance in overall) {
            overall[record.attendance as AttendanceKey]++;
        }
        
        const studentInfo = students.find(st => st.id === record.studentId);
        if (studentInfo) {
            const studentStat = byStudent.find(s => s.name.startsWith(studentInfo.firstName));
            if (studentStat && record.attendance in studentStat) {
                studentStat[record.attendance as AttendanceKey]++;
            }
        }
      });
    });

    const overallChartData = [
      { name: 'Присутствовал', value: overall.present, fill: COLORS.present },
      { name: 'Отсутствовал', value: overall.absent, fill: COLORS.absent },
      { name: 'По ув. причине', value: overall.excused, fill: COLORS.excused },
    ].filter(item => item.value > 0);

    return { overall: overallChartData, byStudent };
  }, [lessons, students]);
  
  const isLoading = isLoadingClasses || isLoadingData;

  return (
    <div className="flex flex-col gap-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Посещаемость</h1>
        <p className="text-muted-foreground">
          Статистика и отчеты по посещаемости учеников за выбранный месяц.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}>
                  <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-lg font-semibold capitalize w-32 text-center">
                  {format(currentDate, 'LLLL yyyy', { locale: ru })}
              </h2>
              <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}>
                  <ChevronRight className="h-4 w-4" />
              </Button>
          </div>
          {isLoadingClasses ? (
            <Skeleton className="h-10 w-[200px]" />
          ) : classes && classes.length > 0 && selectedClassId && (
             <Select onValueChange={setSelectedClassId} defaultValue={selectedClassId}>
                <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Выберите класс" />
                </SelectTrigger>
                <SelectContent>
                {classes.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
          )}
      </div>

      {isLoading ? (
          <div className="grid md:grid-cols-2 gap-6">
              <Skeleton className="h-96 w-full" />
              <Skeleton className="h-96 w-full" />
          </div>
      ) : lessons && lessons.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
            <Card>
            <CardHeader>
                <CardTitle>Общая статистика</CardTitle>
                <CardDescription>Общая посещаемость по классу</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={attendanceData.overall} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                            {attendanceData.overall.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
            <Card>
            <CardHeader>
                <CardTitle>Статистика по ученикам</CardTitle>
                <CardDescription>Посещаемость каждого ученика</CardDescription>
            </CardHeader>
            <CardContent className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={attendanceData.byStudent} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="present" name="Присутствовал" stackId="a" fill={COLORS.present} />
                        <Bar dataKey="absent" name="Отсутствовал" stackId="a" fill={COLORS.absent} />
                        <Bar dataKey="excused" name="По ув. причине" stackId="a" fill={COLORS.excused} />
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>
        </div>
        ) : (
          <Card className="flex-grow">
            <CardContent className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">Нет данных о посещаемости для этого класса за выбранный месяц.</p>
            </CardContent>
          </Card>
        )
      }
    </div>
  );
}

    
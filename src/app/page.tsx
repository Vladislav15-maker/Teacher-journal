
'use client';
import { useState, useEffect, useCallback } from 'react';
import { Gradebook } from '@/components/gradebook';
import { Skeleton } from '@/components/ui/skeleton';
import type { Class, Subject, Student, Lesson } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getClasses } from '@/actions/class-actions';
import { getSubjects } from '@/actions/subject-actions';
import { getStudents } from '@/actions/student-actions';
import { getLessonsForSubject } from '@/actions/lesson-actions';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function Home() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [classes, setClasses] = useState<Omit<Class, 'students'>[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState<string | undefined>(undefined);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchClasses() {
      setIsLoading(true);
      const fetchedClasses = await getClasses();
      setClasses(fetchedClasses);
      if (fetchedClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(fetchedClasses[0].id);
      }
      setIsLoading(false);
    }
    fetchClasses();
  }, []);

  useEffect(() => {
    async function fetchSubjects() {
      if (!selectedClassId) {
        setSubjects([]);
        setSelectedSubjectId(undefined);
        return;
      };
      setIsLoadingSubjects(true);
      const fetchedSubjects = await getSubjects(selectedClassId);
      setSubjects(fetchedSubjects);
      if (fetchedSubjects.length > 0) {
        setSelectedSubjectId(fetchedSubjects[0].id);
      } else {
        setSelectedSubjectId(undefined);
      }
      setIsLoadingSubjects(false);
    }
    fetchSubjects();
  }, [selectedClassId]);

  useEffect(() => {
    async function fetchStudents() {
      if (!selectedClassId) {
        setStudents([]);
        return
      };
      setIsLoadingStudents(true);
      const fetchedStudents = await getStudents(selectedClassId);
      setStudents(fetchedStudents);
      setIsLoadingStudents(false);
    }
    fetchStudents();
  }, [selectedClassId]);
  
  const fetchLessons = useCallback(async () => {
    if (!selectedSubjectId) {
      setLessons([]);
      return;
    };
    setIsLoadingLessons(true);
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const fetchedLessons = await getLessonsForSubject(selectedSubjectId, start.toISOString(), end.toISOString());
    setLessons(fetchedLessons);
    setIsLoadingLessons(false);
  }, [selectedSubjectId, currentDate]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);
  
  const overallLoading = isLoading || isLoadingSubjects || isLoadingStudents;

  if (isLoading) {
    return <Skeleton className="h-[600px] w-full" />;
  }

  if (classes.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col gap-6 h-full">
        <h1 className="text-3xl font-bold tracking-tight">Журнал</h1>
        <div className="flex items-center justify-center h-full">
            <p>Нет созданных классов. Начните с <a href="/classes" className='underline'>добавления класса</a>.</p>
        </div>
      </div>
    );
  }

  const handleClassChange = (classId: string) => {
    setSelectedClassId(classId);
    setSelectedSubjectId(undefined); // Reset subject when class changes
  };

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h1 className="text-3xl font-bold tracking-tight">Журнал</h1>
            <div className="flex items-center gap-2">
            {selectedClassId && (
                <Select onValueChange={handleClassChange} defaultValue={selectedClassId}>
                    <SelectTrigger className="w-[180px]">
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
            {selectedClassId && (subjects.length > 0 || isLoadingSubjects) && (
                <Select onValueChange={setSelectedSubjectId} value={selectedSubjectId}>
                    <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={isLoadingSubjects ? 'Загрузка...' : 'Выберите предмет'} />
                    </SelectTrigger>
                    <SelectContent>
                    {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                        {s.name}
                        </SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            )}
            </div>
        </div>
        
        {overallLoading ? <Skeleton className="h-[600px] w-full" /> : (
            <Gradebook 
                key={`${selectedClassId}-${selectedSubjectId}`}
                students={students || []}
                lessons={lessons || []}
                subjects={subjects || []}
                selectedClassId={selectedClassId}
                selectedSubjectId={selectedSubjectId}
                currentDate={currentDate}
                setCurrentDate={setCurrentDate}
                onLessonsChange={setLessons}
                isLoadingLessons={isLoadingLessons}
            />
        )}
    </div>
  );
}

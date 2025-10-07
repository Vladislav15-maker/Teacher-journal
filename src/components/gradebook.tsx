
'use client';

import { useState, useMemo, useEffect } from 'react';
import type { Student, Lesson, Subject, LessonRecord } from '@/lib/types';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Send, User } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RecordEditorPopover } from './record-editor-popover';
import { LessonEditorSheet } from './lesson-editor-sheet';
import { createLesson, updateLesson } from '@/actions/lesson-actions';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';

interface GradebookProps {
  students: Student[];
  lessons: Lesson[];
  subjects: Subject[];
  selectedClassId?: string;
  selectedSubjectId?: string;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  onLessonsChange: (lessons: Lesson[]) => void;
  isLoadingLessons: boolean;
}

const lessonTypeLabels: { [key: string]: string } = {
    sor: "СОР",
    soch: "СОЧ",
    project: "Проект",
    independent: "С/Р",
};

export function Gradebook({ 
    students, 
    lessons, 
    subjects,
    selectedClassId, 
    selectedSubjectId, 
    currentDate, 
    setCurrentDate,
    onLessonsChange,
    isLoadingLessons,
}: GradebookProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const lessonsByDate = useMemo(() => {
    const map = new Map<string, Lesson>();
    lessons.forEach(lesson => {
      map.set(lesson.date, lesson);
    });
    return map;
  }, [lessons]);

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'prev' ? -1 : 1));
      return newDate;
    });
  };

  const handleHeaderClick = async (date: Date) => {
    if (!selectedSubject || !selectedClassId) return;
    
    const dayOfWeek = getDay(date) === 0 ? 7 : getDay(date);
    const lessonDays = selectedSubject.lessonDays || [];

    if (!lessonDays.includes(dayOfWeek)) {
        return; 
    }

    const dateString = date.toISOString().split('T')[0];
    let lesson = lessonsByDate.get(dateString);

    if (!lesson) {
        if (students.length > 0) {
            const newLesson = await createLesson({
                date: dateString,
                subjectId: selectedSubject.id,
                classId: selectedClassId,
            });
            onLessonsChange([...lessons, newLesson]);
            lesson = newLesson;
        } else {
            return;
        }
    }
    
    setSelectedLesson(lesson);
    setIsSheetOpen(true);
  };
  
  const handleLessonUpdate = async (lesson: Lesson, data: Partial<Lesson>) => {
    if (!selectedSubjectId) return;
    const updatedLesson = await updateLesson(lesson.id, data);
    const newLessons = lessons.map(l => l.id === lesson.id ? updatedLesson : l);
    onLessonsChange(newLessons);
    setSelectedLesson(updatedLesson);
  };
  
  const handleRecordUpdate = async (lessonId: string, studentId: string, newRecordData: Partial<LessonRecord>) => {
      const lessonToUpdate = lessons.find(l => l.id === lessonId);
      if (!lessonToUpdate || !selectedSubjectId) return;
      
      const updatedRecords = (lessonToUpdate.records || []).map(r => 
        r.studentId === studentId ? { ...r, ...newRecordData } : r
      );
      
      const updatedLesson = await updateLesson(lessonId, { records: updatedRecords as any });
      const newLessons = lessons.map(l => l.id === lessonId ? updatedLesson : l);
      onLessonsChange(newLessons);
  };
  
  useEffect(() => {
    if (selectedLesson) {
        const updatedLesson = lessons.find(l => l.id === selectedLesson.id);
        if (updatedLesson) {
            setSelectedLesson(updatedLesson);
        }
    }
  }, [lessons, selectedLesson]);

  if (!selectedSubjectId || !selectedSubject) {
    return (
        <Card className="flex items-center justify-center h-96">
            <p className="text-muted-foreground">Выберите класс и предмет для просмотра журнала.</p>
        </Card>
    );
  }

  if (students.length === 0) {
      return (
          <Card className="flex items-center justify-center h-96">
              <p className="text-muted-foreground">В этом классе нет учеников. <a href="/classes" className="underline">Добавьте учеников</a>, чтобы начать вести журнал.</p>
          </Card>
      );
  }
  
  if (isLoadingLessons) {
      return <Skeleton className="h-[600px] w-full" />;
  }


  return (
    <Card>
        <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => handleMonthChange('prev')}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-semibold capitalize">
                    {format(currentDate, 'LLLL yyyy', { locale: ru })}
                </h2>
                <Button variant="outline" size="icon" onClick={() => handleMonthChange('next')}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
                </div>
            </div>
            <div className="w-full overflow-auto rounded-lg border">
                <Table className="min-w-max">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                    <TableHead className="min-w-[250px] font-semibold sticky left-0 bg-muted/50 z-20">Ученик</TableHead>
                    {monthDays.map(day => {
                        const lesson = lessonsByDate.get(day.toISOString().split('T')[0]);
                        const dayOfWeek = getDay(day) === 0 ? 7 : getDay(day);
                        const isLessonDay = selectedSubject.lessonDays?.includes(dayOfWeek);
                        const isImportantLesson = lesson && lesson.lessonType && lesson.lessonType !== 'classwork';
                        const lessonTypeLabel = lesson?.lessonType && lessonTypeLabels[lesson.lessonType];

                        return (
                        <TableHead 
                            key={day.toString()} 
                            className={cn(
                                "min-w-[200px] text-left align-top font-semibold border-l p-1",
                                isLessonDay && "cursor-pointer hover:bg-primary/10",
                                isImportantLesson && "bg-green-100/50"
                            )}
                            onClick={() => handleHeaderClick(day)}
                        >
                            <div className="flex flex-col items-center">
                                <span className="text-xs">{format(day, 'EEE', { locale: ru })}</span>
                                <span className="text-lg">{format(day, 'd')}</span>
                            </div>
                            {lesson && (
                                <div className="mt-1 text-xs font-normal text-muted-foreground space-y-1 p-1">
                                    <p className="truncate w-full">
                                        <span className="font-semibold">Тема:</span> {lesson.topic} {lessonTypeLabel && `(${lessonTypeLabel})`}
                                    </p>
                                    <p className="truncate w-full"><span className="font-semibold">Д/З:</span> {lesson.homework}</p>
                                </div>
                            )}
                        </TableHead>
                        );
                    })}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {students.map((student) => (
                    <TableRow key={student.id} className="hover:bg-primary/10">
                        <TableCell className="font-medium sticky left-0 bg-background z-10">
                        <div className="flex items-center gap-2 justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-muted-foreground">
                                    <User className="h-5 w-5" />
                                </div>
                                <span>{student.firstName} {student.lastName}</span> 
                            </div>
                            <Link href={`/messages?classId=${selectedClassId}&studentId=${student.id}`} passHref>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Send className="h-4 w-4 text-muted-foreground"/>
                                </Button>
                            </Link>
                        </div>
                        </TableCell>
                        {monthDays.map(day => {
                        const dateString = day.toISOString().split('T')[0];
                        const lesson = lessonsByDate.get(dateString);
                        const record = lesson?.records?.find(r => r.studentId === student.id);
                        const isImportantLesson = lesson && lesson.lessonType && lesson.lessonType !== 'classwork';
                        
                        return (
                            <TableCell key={day.toString()} className={cn(
                                "text-center border-l p-0 align-middle",
                                isImportantLesson && "bg-green-100/50"
                            )}>
                                {lesson && record ? (
                                     <RecordEditorPopover 
                                        student={student}
                                        lesson={lesson}
                                        record={record}
                                        onSave={(newRecordData) => handleRecordUpdate(lesson.id, student.id, newRecordData)}
                                    >
                                        <div className="flex flex-col items-center justify-center h-full w-full cursor-pointer hover:bg-accent p-2 min-h-[58px]">
                                            <span className={cn("font-bold text-lg", record.grade && lesson.maxScore && record.grade < (lesson.maxScore / 2) ? "text-destructive" : "text-green-600")}>
                                                {record.grade ?? ''}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{record.attendance === 'present' ? '' : record.attendance === 'absent' ? 'Н' : 'Ув.'}</span>
                                            {record.comment && <span className="text-[10px] text-muted-foreground truncate w-full px-1">{record.comment}</span>}
                                        </div>
                                    </RecordEditorPopover>
                                ) : (
                                    <div className="h-16"></div>
                                )}
                            </TableCell>
                        );
                        })}
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
            {selectedLesson && (
                <LessonEditorSheet 
                    open={isSheetOpen}
                    onOpenChange={setIsSheetOpen}
                    lesson={selectedLesson}
                    onUpdate={(data) => handleLessonUpdate(selectedLesson, data)}
                />
            )}
        </CardContent>
    </Card>
  );
}

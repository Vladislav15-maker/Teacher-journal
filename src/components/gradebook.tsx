
'use client';

import { useState, useMemo, useCallback } from 'react';
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
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  const selectedSubject = useMemo(() => subjects.find(s => s.id === selectedSubjectId), [subjects, selectedSubjectId]);

  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const lessonsByDate = useMemo(() => {
    const map = new Map<string, Lesson>();
    (lessons || []).forEach(lesson => {
      map.set(format(new Date(lesson.date), 'yyyy-MM-dd'), lesson);
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

  const handleHeaderClick = useCallback(async (date: Date) => {
    if (!selectedSubjectId || !selectedClassId || !selectedSubject) return;

    const dayOfWeek = getDay(date);
    const lessonDays = selectedSubject.lessonDays || [];
    const mappedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;
    
    if (!lessonDays.includes(mappedDayOfWeek)) {
        return; 
    }

    const dateString = format(date, 'yyyy-MM-dd');
    let lesson = lessonsByDate.get(dateString);

    if (!lesson) {
        if (students.length === 0) {
            toast({ variant: 'destructive', title: "Ошибка", description: "В классе нет учеников, невозможно создать урок." });
            return;
        }
        try {
            const newLesson = await createLesson({
                date: date.toISOString(),
                subjectId: selectedSubjectId,
                classId: selectedClassId,
            });
            onLessonsChange([...(lessons || []), newLesson]);
            setSelectedLesson(newLesson);
            setIsSheetOpen(true);
        } catch (error) {
            console.error("Failed to create lesson:", error);
            toast({ variant: 'destructive', title: "Ошибка создания урока", description: "Не удалось создать новый урок." });
        }
    } else {
        setSelectedLesson(lesson);
        setIsSheetOpen(true);
    }
  }, [selectedSubjectId, selectedClassId, selectedSubject, lessonsByDate, students, lessons, onLessonsChange, toast]);
  
  const handleLessonUpdate = useCallback(async (lesson: Lesson, data: Partial<Omit<Lesson, 'records'>>) => {
    try {
        const updatedLessonWithRecords = await updateLesson(lesson.id, data);
        const newLessons = (lessons || []).map(l => l.id === lesson.id ? updatedLessonWithRecords : l);
        onLessonsChange(newLessons);
        setSelectedLesson(updatedLessonWithRecords); // Keep sheet updated
    } catch (error) {
        console.error("Failed to update lesson:", error);
        toast({ variant: 'destructive', title: "Ошибка обновления", description: "Не удалось сохранить изменения урока." });
    }
  }, [lessons, onLessonsChange, toast]);
  
  const handleRecordUpdate = useCallback(async (lessonId: string, studentId: string, newRecordData: Partial<LessonRecord>) => {
      const lessonToUpdate = (lessons || []).find(l => l.id === lessonId);
      if (!lessonToUpdate) return;
      
      const records = (lessonToUpdate.records || []).map(r => 
        r.studentId === studentId ? { ...r, ...newRecordData } : r
      );

      try {
        const updatedLesson = await updateLesson(lessonId, { records: records as any });
        const newLessons = (lessons || []).map(l => l.id === lessonId ? updatedLesson : l);
        onLessonsChange(newLessons);
      } catch (error) {
          console.error("Failed to update record:", error);
          toast({ variant: 'destructive', title: "Ошибка сохранения", description: "Не удалось сохранить оценку." });
      }
  }, [lessons, onLessonsChange, toast]);
  
  // This effect ensures that the data in the sheet is always fresh
  // if the underlying lesson data changes while the sheet is open.
  const currentlySelectedLesson = lessons.find(l => l.id === selectedLesson?.id);
  useEffect(() => {
    if (isSheetOpen && currentlySelectedLesson) {
        setSelectedLesson(currentlySelectedLesson);
    }
  }, [isSheetOpen, currentlySelectedLesson]);

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
                        const lesson = lessonsByDate.get(format(day, 'yyyy-MM-dd'));
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
                        const dateString = format(day, 'yyyy-MM-dd');
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
                                    <div className="h-full min-h-[58px]"></div>
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


'use client';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import type { Lesson, LessonType } from '@/lib/types';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface LessonEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lesson: Lesson;
  onUpdate: (data: Partial<Lesson>) => void;
}

const lessonTypeLabels: Record<LessonType, string> = {
    classwork: 'Классная работа',
    independent: 'Самостоятельная работа',
    project: 'Проектная работа',
    sor: 'СОР',
    soch: 'СОЧ',
};

export function LessonEditorSheet({ open, onOpenChange, lesson, onUpdate }: LessonEditorSheetProps) {
  const [topic, setTopic] = useState(lesson.topic);
  const [homework, setHomework] = useState(lesson.homework);
  const [lessonType, setLessonType] = useState<LessonType>(lesson.lessonType || 'classwork');
  const [maxScore, setMaxScore] = useState<number | undefined>(lesson.maxScore);

  useEffect(() => {
    setTopic(lesson.topic);
    setHomework(lesson.homework);
    setLessonType(lesson.lessonType || 'classwork');
    setMaxScore(lesson.maxScore);
  }, [lesson]);

  const handleSave = () => {
    const dataToUpdate: Partial<Lesson> = { topic, homework, lessonType };
    if (lessonType !== 'classwork') {
      dataToUpdate.maxScore = maxScore;
    } else {
      dataToUpdate.maxScore = undefined;
    }
    onUpdate(dataToUpdate);
    onOpenChange(false);
  };
  
  const formattedDate = format(new Date(lesson.date), "d MMMM yyyy 'г.'", { locale: ru });

  const isSpecialWork = lessonType && lessonType !== 'classwork';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Редактор урока</SheetTitle>
          <SheetDescription>
            Измените тему и домашнее задание для урока ({formattedDate}).
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid items-center gap-2">
            <Label htmlFor="topic">Тема урока</Label>
            <Input 
                id="topic" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
            />
          </div>
          <div className="grid items-center gap-2">
            <Label htmlFor="homework">Домашнее задание</Label>
            <Textarea 
                id="homework" 
                value={homework} 
                onChange={(e) => setHomework(e.target.value)}
            />
          </div>
          <div className="grid items-center gap-2">
            <Label htmlFor="lesson-type">Тип урока</Label>
            <Select value={lessonType} onValueChange={(value) => setLessonType(value as LessonType)}>
                <SelectTrigger id="lesson-type">
                    <SelectValue placeholder="Выберите тип урока" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(lessonTypeLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>
          {isSpecialWork && (
            <div className="grid items-center gap-2">
                <Label htmlFor="max-score">Максимум баллов</Label>
                <Input
                    id="max-score"
                    type="number"
                    value={maxScore || ''}
                    onChange={(e) => setMaxScore(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Напр., 25"
                />
            </div>
          )}
        </div>
        <SheetFooter>
            <SheetClose asChild>
                <Button variant="secondary">Отмена</Button>
            </SheetClose>
          <Button onClick={handleSave}>Сохранить</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

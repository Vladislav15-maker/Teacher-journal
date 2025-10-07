
"use client"

import { useState } from "react";
import type { LessonRecord, Student, AttendanceStatus, Lesson } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Textarea } from "./ui/textarea";
import { CheckCircle2, XCircle, Clock, User } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import { PopoverClose } from "@radix-ui/react-popover";

interface RecordEditorPopoverProps {
  student: Student;
  lesson: Lesson;
  record: LessonRecord;
  onSave: (data: Partial<LessonRecord>) => void;
  children: React.ReactNode;
}

export function RecordEditorPopover({ student, lesson, record, onSave, children }: RecordEditorPopoverProps) {
  const [grade, setGrade] = useState(record.grade?.toString() || '');
  const [attendance, setAttendance] = useState<AttendanceStatus>(record.attendance);
  const [comment, setComment] = useState(record.comment || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    const newGrade = grade ? parseInt(grade, 10) : null;
    const maxScore = lesson.maxScore;

    if (newGrade && maxScore && (newGrade < 0 || newGrade > maxScore)) {
        return; // Validation
    }
    
    onSave({
      grade: newGrade,
      attendance,
      comment: comment.trim() || null,
    });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground">
                    <User className="h-6 w-6" />
                </div>
                <h4 className="font-medium leading-none">{student.firstName} {student.lastName}</h4>
            </div>
            <p className="text-sm text-muted-foreground">
                Редактирование записи {lesson.maxScore ? `(макс. ${lesson.maxScore} баллов)` : ''}
            </p>
          </div>
          <div className="grid gap-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="grade">Оценка</Label>
              <Input 
                id="grade" 
                type="number"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="col-span-2 h-8" 
                min="0" 
                max={lesson.maxScore || 5}
                />
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
                <Label>Посещ.</Label>
                <RadioGroup 
                    value={attendance}
                    onValueChange={(value: AttendanceStatus) => setAttendance(value)}
                    className="col-span-2 flex items-center gap-2"
                >
                    <Label htmlFor={`${student.id}-present`} className="flex items-center gap-1 cursor-pointer p-2 rounded-md hover:bg-accent">
                        <RadioGroupItem value="present" id={`${student.id}-present`} />
                        <CheckCircle2 className="h-5 w-5 text-[hsl(var(--chart-2))]"/>
                    </Label>
                    <Label htmlFor={`${student.id}-absent`} className="flex items-center gap-1 cursor-pointer p-2 rounded-md hover:bg-accent">
                        <RadioGroupItem value="absent" id={`${student.id}-absent`} />
                        <XCircle className="h-5 w-5 text-[hsl(var(--chart-1))]"/>
                    </Label>
                    <Label htmlFor={`${student.id}-excused`} className="flex items-center gap-1 cursor-pointer p-2 rounded-md hover:bg-accent">
                        <RadioGroupItem value="excused" id={`${student.id}-excused`} />
                        <Clock className="h-5 w-5 text-[hsl(var(--chart-4))]"/>
                    </Label>
                </RadioGroup>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="comment">Комментарий</Label>
              <Textarea 
                id="comment" 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Напр., 'Ответ у доски'"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <PopoverClose asChild>
              <Button variant="secondary">Отмена</Button>
            </PopoverClose>
            <Button onClick={handleSave}>Сохранить</Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

    
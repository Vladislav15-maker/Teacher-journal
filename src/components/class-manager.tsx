
"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import type { Class, Student, Subject } from "@/lib/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { PlusCircle, Users, Edit, Trash2, Book, User as UserIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { createClass, updateClass, deleteClass } from "@/actions/class-actions";
import { getStudents, createStudent, updateStudent, deleteStudent } from "@/actions/student-actions";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "@/actions/subject-actions";

interface ClassManagerProps {
  initialClasses: Omit<Class, 'students'>[];
  onClassesChange: (classes: Omit<Class, 'students'>[]) => void;
}

export function ClassManager({ initialClasses, onClassesChange }: ClassManagerProps) {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(initialClasses[0]?.id || null);
  const [activeTab, setActiveTab] = useState<'students' | 'subjects'>('students');

  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const fetchStudents = async (classId: string) => {
    const studentData = await getStudents(classId);
    setStudents(studentData);
  };

  const fetchSubjects = async (classId: string) => {
    const subjectData = await getSubjects(classId);
    setSubjects(subjectData);
  }

  useEffect(() => {
    if (!selectedClassId) {
      setStudents([]);
      setSubjects([]);
      return;
    }
    fetchStudents(selectedClassId);
    fetchSubjects(selectedClassId);
  }, [selectedClassId]);
  
  useEffect(() => {
    if (!selectedClassId && initialClasses.length > 0) {
        setSelectedClassId(initialClasses[0].id);
    }
  }, [initialClasses, selectedClassId]);

  const handleAddClass = async (name: string) => {
    const newClass = await createClass(name);
    onClassesChange([...initialClasses, newClass]);
  };

  const handleEditClass = async (id: string, name: string) => {
    const updated = await updateClass(id, name);
    onClassesChange(initialClasses.map(c => c.id === id ? updated : c));
  };
  
  const handleDeleteClass = async (id: string) => {
    await deleteClass(id);
    const updatedClasses = initialClasses.filter(c => c.id !== id);
    onClassesChange(updatedClasses);

    if (selectedClassId === id) {
      setSelectedClassId(updatedClasses.length > 0 ? updatedClasses[0].id : null);
    }
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    setActiveTab('students');
  };
  
  const selectedClass = initialClasses.find(c => c.id === selectedClassId);

  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'classroomId'>) => {
    if (!selectedClassId) return;
    await createStudent(selectedClassId, studentData);
    fetchStudents(selectedClassId); // Re-fetch
  };

  const handleEditStudent = async (studentId: string, studentData: Partial<Omit<Student, 'id'>>) => {
    if (!selectedClassId) return;
    await updateStudent(studentId, studentData);
    fetchStudents(selectedClassId); // Re-fetch
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!selectedClassId) return;
    await deleteStudent(studentId);
    fetchStudents(selectedClassId); // Re-fetch
  };

  const handleAddSubject = async (subjectData: Omit<Subject, 'id' | 'classId'>) => {
    if (!selectedClassId) return;
    await createSubject(selectedClassId, subjectData);
    fetchSubjects(selectedClassId); // Re-fetch
  };

  const handleEditSubject = async (subjectId: string, subjectData: Partial<Omit<Subject, 'id'>>) => {
    if (!selectedClassId) return;
    await updateSubject(subjectId, subjectData);
    fetchSubjects(selectedClassId); // Re-fetch
  };

  const handleDeleteSubject = async (subjectId: string) => {
    if (!selectedClassId) return;
    await deleteSubject(subjectId);
    fetchSubjects(selectedClassId); // Re-fetch
  };


  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 flex flex-col gap-4">
        <AddClassDialog onAddClass={handleAddClass} />
        <Card>
            <CardHeader>
                <CardTitle>Список классов</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {initialClasses?.map(c => (
                    <Button 
                        key={c.id} 
                        variant={selectedClassId === c.id ? 'secondary' : 'ghost'} 
                        onClick={() => handleSelectClass(c.id)}
                        className="w-full justify-start"
                    >
                        <Users className="mr-2 h-4 w-4" />
                        {c.name}
                    </Button>
                ))}
            </CardContent>
        </Card>
      </div>
      <div className="md:col-span-2">
        {selectedClass ? (
          <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Класс: {selectedClass.name}</CardTitle>
                        <div className="flex gap-1 mt-2">
                            <Button variant={activeTab === 'students' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('students')}>
                                <Users className="mr-2 h-4 w-4" /> Ученики
                            </Button>
                             <Button variant={activeTab === 'subjects' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('subjects')}>
                                <Book className="mr-2 h-4 w-4" /> Предметы
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                         {activeTab === 'students' ? (
                            <StudentDialog mode="add" onSave={handleAddStudent}>
                                <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Добавить ученика</Button>
                            </StudentDialog>
                         ) : (
                            <SubjectDialog mode="add" onSave={handleAddSubject}>
                                 <Button variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4"/>Добавить предмет</Button>
                            </SubjectDialog>
                         )}
                         <EditClassDialog classData={selectedClass} onEdit={handleEditClass}>
                            <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                         </EditClassDialog>
                         <DeleteConfirmationDialog onConfirm={() => handleDeleteClass(selectedClass.id)} title="Удалить класс?" description={`Вы уверены, что хотите удалить класс "${selectedClass.name}"? Это действие нельзя будет отменить.`}>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4"/>
                            </Button>
                         </DeleteConfirmationDialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {activeTab === 'students' ? (
                    <div className="flex flex-col gap-4">
                        {students && students.length > 0 ? students.map((student, index) => (
                            <React.Fragment key={student.id}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-muted text-muted-foreground">
                                        <UserIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <StudentDialog mode="edit" student={student} onSave={(data) => handleEditStudent(student.id, data)}>
                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                    </StudentDialog>
                                    <DeleteConfirmationDialog onConfirm={() => handleDeleteStudent(student.id)} title="Удалить ученика?" description={`Вы уверены, что хотите удалить ученика ${student.firstName} ${student.lastName}?`}>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                    </DeleteConfirmationDialog>
                                </div>
                            </div>
                            {index < students.length - 1 && <Separator />}
                            </React.Fragment>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">В этом классе пока нет учеников.</p>
                        )}
                    </div>
                ) : (
                     <div className="flex flex-col gap-4">
                        {subjects && subjects.length > 0 ? subjects.map((subject, index) => (
                            <React.Fragment key={subject.id}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Book className="h-6 w-6 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{subject.name}</p>
                                        <div className="flex gap-1 mt-1">
                                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, i) => (
                                                <Badge key={day} variant={(subject.lessonDays || []).includes(i + 1) ? 'default': 'outline'}>
                                                    {day}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <SubjectDialog mode="edit" subject={subject} onSave={(data) => handleEditSubject(subject.id, data)}>
                                        <Button variant="ghost" size="icon"><Edit className="h-4 w-4"/></Button>
                                    </SubjectDialog>
                                    <DeleteConfirmationDialog onConfirm={() => handleDeleteSubject(subject.id)} title="Удалить предмет?" description={`Вы уверены, что хотите удалить предмет "${subject.name}"?`}>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                    </DeleteConfirmationDialog>
                                </div>
                            </div>
                            {index < subjects.length - 1 && <Separator />}
                            </React.Fragment>
                        )) : (
                            <p className="text-center text-muted-foreground py-8">В этом классе пока нет предметов.</p>
                        )}
                    </div>
                )}
              
            </CardContent>
          </Card>
        ) : (
            <div className="flex items-center justify-center h-full rounded-lg border border-dashed">
                <div className="text-center">
                    <p className="text-muted-foreground">Выберите класс для просмотра</p>
                    <p className="text-sm text-muted-foreground">или создайте новый.</p>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}


function AddClassDialog({ onAddClass }: { onAddClass: (name: string) => void }) {
    const [name, setName] = useState('');
    const [open, setOpen] = useState(false);
  
    const handleAdd = () => {
      if (name.trim()) {
        onAddClass(name.trim());
        setName('');
        setOpen(false);
      }
    };
  
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить класс
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новый класс</DialogTitle>
            <DialogDescription>Введите название для нового класса, например "10Б".</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Название</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                className="col-span-3"
                placeholder="Напр. 10Б"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="secondary">Отмена</Button>
            </DialogClose>
            <Button type="submit" onClick={handleAdd}>Создать</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
}

function EditClassDialog({ children, classData, onEdit }: { children: React.ReactNode, classData: Omit<Class, 'students'>, onEdit: (id: string, name: string) => void }) {
    const [name, setName] = useState(classData.name);
    const [open, setOpen] = useState(false);

    const handleSave = () => {
        if (name.trim()) {
            onEdit(classData.id, name.trim());
            setOpen(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Редактировать класс</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Название</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary">Отмена</Button></DialogClose>
                    <Button type="submit" onClick={handleSave}>Сохранить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function StudentDialog({ mode, onSave, student, children }: { mode: 'add' | 'edit', onSave: (data: any) => void, student?: Student, children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [firstName, setFirstName] = useState(student?.firstName || '');
    const [lastName, setLastName] = useState(student?.lastName || '');
    
    const title = mode === 'add' ? 'Добавить ученика' : 'Редактировать ученика';

    const handleSave = () => {
        if (firstName.trim() && lastName.trim()) {
            onSave({ firstName, lastName });
            setOpen(false);
            if (mode === 'add') {
                setFirstName('');
                setLastName('');
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="firstName" className="text-right">Имя</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="lastName" className="text-right">Фамилия</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">Отмена</Button></DialogClose>
                    <Button onClick={handleSave}>Сохранить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

const daysOfWeek = [
    { id: 1, label: 'Понедельник' },
    { id: 2, label: 'Вторник' },
    { id: 3, label: 'Среда' },
    { id: 4, label: 'Четверг' },
    { id: 5, label: 'Пятница' },
    { id: 6, label: 'Суббота' },
    { id: 7, label: 'Воскресенье' },
];

function SubjectDialog({ mode, onSave, subject, children }: { mode: 'add' | 'edit', onSave: (data: any) => void, subject?: Subject, children: React.ReactNode }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(subject?.name || '');
    const [lessonDays, setLessonDays] = useState<number[]>(subject?.lessonDays || []);

    useEffect(() => {
        if (mode === 'add') {
            setName('');
            setLessonDays([]);
        } else {
            setName(subject?.name || '');
            setLessonDays(subject?.lessonDays || []);
        }
    }, [open, mode, subject]);

    const title = mode === 'add' ? 'Добавить предмет' : 'Редактировать предмет';

    const handleSave = () => {
        if (name.trim()) {
            onSave({ name, lessonDays });
            setOpen(false);
        }
    };
    
    const handleDayToggle = (day: number) => {
        setLessonDays(prev => 
            prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
        );
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Название</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                     <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Дни уроков</Label>
                        <div className="col-span-3 grid grid-cols-2 gap-2">
                             {daysOfWeek.map(day => (
                                <div key={day.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`day-${day.id}`}
                                        checked={lessonDays.includes(day.id)}
                                        onCheckedChange={() => handleDayToggle(day.id)}
                                    />
                                    <label
                                        htmlFor={`day-${day.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {day.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">Отмена</Button></DialogClose>
                    <Button onClick={handleSave}>Сохранить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeleteConfirmationDialog({ children, onConfirm, title, description }: { children: React.ReactNode, onConfirm: () => void, title: string, description: string }) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>Удалить</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

    
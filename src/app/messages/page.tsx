
'use client';

import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Class, Student, Message } from '@/lib/types';
import { getClasses } from "@/actions/class-actions";
import { getStudents } from "@/actions/student-actions";
import { getMessages, createMessage } from "@/actions/message-actions";
import { useSession } from "next-auth/react";

function MessagesPageContent() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(searchParams.get('classId'));
  const [selectedStudentId, setSelectedStudentId] = useState<string | 'general'>(searchParams.get('studentId') || 'general');
  const [messageText, setMessageText] = useState('');

  const [classes, setClasses] = useState<Omit<Class, 'students'>[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    async function fetchClasses() {
        const data = await getClasses();
        setClasses(data);
        if (data.length > 0 && !selectedClassId) {
            setSelectedClassId(data[0].id);
        }
    }
    fetchClasses();
  }, []);

  useEffect(() => {
    if (!selectedClassId) return;
    async function fetchStudents() {
        const data = await getStudents(selectedClassId!);
        setStudents(data);
    }
    async function fetchMessages() {
        const data = await getMessages(selectedClassId!);
        setMessages(data);
    }
    fetchStudents();
    fetchMessages();
  }, [selectedClassId]);
  
  useEffect(() => {
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    if (classId) setSelectedClassId(classId);
    if (studentId) setSelectedStudentId(studentId);
  }, [searchParams]);

  const handleSendMessage = async () => {
    if (!session?.user?.id || !selectedClassId || !messageText.trim()) return;
    
    await createMessage({
        senderId: session.user.id,
        studentId: selectedStudentId === 'general' ? null : selectedStudentId,
        classroomId: selectedClassId,
        text: messageText,
    });
    
    const updatedMessages = await getMessages(selectedClassId);
    setMessages(updatedMessages);

    setMessageText('');
    toast({
        title: "Сообщение отправлено!",
        description: "Ваше сообщение было успешно отправлено.",
    });
  };

  const filteredMessages = useMemo(() => {
    if (!messages) return [];
    if (selectedStudentId === 'general') {
        return messages.filter(m => !m.studentId);
    }
    return messages.filter(m => m.studentId === selectedStudentId);
  }, [messages, selectedStudentId]);

  return (
    <div className="flex flex-col gap-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Сообщения</h1>
        <p className="text-muted-foreground">
          Отправка сообщений ученикам и комментарии к урокам.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle>Отправить сообщение</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {classes && selectedClassId && (
                        <Select onValueChange={(id) => { setSelectedClassId(id); setSelectedStudentId('general'); }} value={selectedClassId}>
                            <SelectTrigger><SelectValue placeholder="Выберите класс" /></SelectTrigger>
                            <SelectContent>
                                {classes.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    {students && (
                        <Select onValueChange={(id) => setSelectedStudentId(id)} value={selectedStudentId}>
                            <SelectTrigger><SelectValue placeholder="Выберите получателя" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="general">Весь класс</SelectItem>
                                {students.map((s) => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    )}
                    <Textarea 
                        placeholder="Введите ваше сообщение..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        rows={5}
                    />
                    <Button onClick={handleSendMessage} disabled={!messageText.trim()}>Отправить</Button>
                </CardContent>
            </Card>
        </div>
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>История сообщений</CardTitle>
                    <CardDescription>
                        {selectedStudentId === 'general' 
                            ? 'Сообщения для всего класса' 
                            : `Сообщения для ${students?.find(s => s.id === selectedStudentId)?.firstName || ''} ${students?.find(s => s.id === selectedStudentId)?.lastName || ''}`
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ScrollArea className="h-96 pr-4">
                        <div className="flex flex-col gap-4">
                            {filteredMessages && filteredMessages.length > 0 ? (
                                filteredMessages
                                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                    .map(msg => (
                                    <div key={msg.id} className="flex items-start gap-3 rounded-lg border p-3">
                                        <Avatar>
                                            <AvatarFallback>T</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold">Учитель</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {msg.timestamp ? format(new Date(msg.timestamp), 'dd MMM yyyy, HH:mm', { locale: ru }) : ''}
                                                </p>
                                            </div>
                                            <p className="text-sm mt-1 whitespace-pre-wrap">{msg.text}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-muted-foreground py-8">Нет сообщений для отображения.</p>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <React.Suspense fallback={<div>Загрузка...</div>}>
      <MessagesPageContent />
    </React.Suspense>
  )
}

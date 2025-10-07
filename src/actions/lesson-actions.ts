
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Lesson } from "@prisma/client";

export async function getLessonsForSubject(subjectId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const lessons = await db.lesson.findMany({
        where: { 
            subjectId,
            subject: {
                class: {
                    teacherId: session.user.id
                }
            }
        },
        include: {
            records: true
        }
    });

    return lessons as any;
}

export async function getLessonsForClass(classId: string, startDate?: string, endDate?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const whereClause: any = {
        classId,
        class: {
            teacherId: session.user.id
        }
    };

    if (startDate && endDate) {
        whereClause.date = {
            gte: startDate,
            lte: endDate
        };
    }

    const lessons = await db.lesson.findMany({
        where: whereClause,
        include: {
            records: true
        }
    });
    return lessons as any;
}


export async function createLesson(data: { date: string, subjectId: string, classId: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    
    const students = await db.student.findMany({ where: { classroomId: data.classId }});
    
    const newLesson = await db.lesson.create({
        data: {
            date: data.date,
            topic: 'Новая тема',
            homework: '',
            subjectId: data.subjectId,
            classId: data.classId,
            lessonType: 'classwork',
        }
    });
    
    // Create empty records for all students in the class
    const lessonRecords = students.map(student => ({
        lessonId: newLesson.id,
        studentId: student.id,
        grade: null,
        attendance: 'present' as const,
        comment: null,
    }));
    
    await db.lessonRecord.createMany({
        data: lessonRecords,
    });
    
    const createdLesson = await db.lesson.findUnique({ where: { id: newLesson.id }, include: { records: true }});

    return createdLesson as any;
}

export async function updateLesson(id: string, data: Partial<Omit<Lesson, 'id'>>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    if (data.records) {
        // This is a special case to update records, as they are a relation
        const records = data.records as any[];
        delete data.records; // remove from main data object
        
        // Update main lesson data first
        if(Object.keys(data).length > 0) {
            await db.lesson.update({
                where: { id },
                data: data,
            });
        }
        
        // Then update/create records
        for (const record of records) {
            const { id: recordId, ...recordData } = record;
            if (recordId) {
                await db.lessonRecord.update({
                    where: { id: recordId },
                    data: recordData
                })
            }
        }
        const updatedLesson = await db.lesson.findUnique({ where: { id }, include: { records: true }});
        return updatedLesson as any;
    }

    const updatedLesson = await db.lesson.update({
        where: { id },
        data,
    });
    const lessonWithRecords = await db.lesson.findUnique({ where: { id }, include: { records: true }});
    return lessonWithRecords as any;
}

    
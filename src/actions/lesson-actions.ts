
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Lesson as LessonWithRecords, Lesson as PrismaLesson, LessonRecord } from "@/lib/types";

// Helper function to combine lessons with their records
async function getLessonsWithRecords(lessons: PrismaLesson[]): Promise<LessonWithRecords[]> {
    const lessonIds = lessons.map(l => l.id);
    if (lessonIds.length === 0) {
        return lessons.map(lesson => ({ ...lesson, records: [] }));
    }
    const records = await db.lessonRecord.findMany({
        where: {
            lessonId: {
                in: lessonIds,
            },
        },
    });

    const recordsByLessonId = new Map<string, LessonRecord[]>();
    records.forEach(record => {
        if (!recordsByLessonId.has(record.lessonId)) {
            recordsByLessonId.set(record.lessonId, []);
        }
        recordsByLessonId.get(record.lessonId)!.push(record);
    });

    return lessons.map(lesson => ({
        ...lesson,
        records: recordsByLessonId.get(lesson.id) || [],
    }));
}


export async function getLessonsForSubject(subjectId: string, startDate?: string, endDate?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const whereClause: any = {
        subjectId,
        subject: {
            classroom: {
                teacherId: session.user.id
            }
        }
    };

    if (startDate && endDate) {
        whereClause.date = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    const lessons = await db.lesson.findMany({
        where: whereClause,
        orderBy: {
            date: 'asc'
        }
    });

    return getLessonsWithRecords(lessons);
}

export async function getLessonsForClass(classId: string, startDate?: string, endDate?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const whereClause: any = {
        classId,
        classroom: {
            teacherId: session.user.id
        }
    };

    if (startDate && endDate) {
        whereClause.date = {
            gte: new Date(startDate),
            lte: new Date(endDate)
        };
    }

    const lessons = await db.lesson.findMany({
        where: whereClause,
        orderBy: {
            date: 'asc'
        }
    });
    
    return getLessonsWithRecords(lessons);
}


export async function createLesson(data: { date: string, subjectId: string, classId: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    
    const students = await db.student.findMany({ where: { classroomId: data.classId }});
    
    const newLesson = await db.lesson.create({
        data: {
            date: new Date(data.date), // Prisma handles Date object correctly for DateTime fields
            topic: 'Новая тема',
            homework: '',
            subjectId: data.subjectId,
            classId: data.classId,
            lessonType: 'classwork',
        }
    });
    
    // Create empty records for all students in the class
    if (students.length > 0) {
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
    }
        
    const createdLesson = await db.lesson.findUnique({ where: { id: newLesson.id }});
    if (!createdLesson) throw new Error("Could not find created lesson");

    return (await getLessonsWithRecords([createdLesson]))[0];
}

export async function updateLesson(id: string, data: Partial<Omit<PrismaLesson, 'id' | 'records'>> & { records?: Partial<LessonRecord>[] }) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const { records, ...lessonData } = data;
    
    // If there are records to update
    if (records && Array.isArray(records)) {
        for (const record of records) {
            if (record.id) {
                const { id: recordId, ...recordData } = record;
                await db.lessonRecord.update({
                    where: { id: recordId },
                    data: recordData
                });
            }
        }
    }
    
    // If there's other lesson data to update
    if (Object.keys(lessonData).length > 0) {
        await db.lesson.update({
            where: { id },
            data: lessonData as any, // Cast to any to avoid type issues with prisma relations
        });
    }

    const updatedLesson = await db.lesson.findUnique({ where: { id } });
    if (!updatedLesson) throw new Error("Could not find updated lesson");

    return (await getLessonsWithRecords([updatedLesson]))[0];
}

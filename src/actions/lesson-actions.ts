
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Prisma, Lesson as PrismaLesson, LessonRecord } from "@prisma/client";
import type { Lesson } from "@/lib/types";

// This is a more robust way to handle fetching lessons with their records.
async function getLessonsWithRecords(where: Prisma.LessonWhereInput): Promise<Lesson[]> {
    const lessons = await db.lesson.findMany({
        where,
        orderBy: {
            date: 'asc'
        }
    });

    const lessonIds = lessons.map(l => l.id);
    if (lessonIds.length === 0) {
        return lessons.map(lesson => ({ ...lesson, records: [] }));
    }

    const records = await db.lessonRecord.findMany({
        where: {
            lessonId: { in: lessonIds }
        }
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
        records: recordsByLessonId.get(lesson.id) || []
    }));
}

export async function getLessonsForSubject(subjectId: string, startDate?: string, endDate?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const whereClause: Prisma.LessonWhereInput = {
        subjectId,
        subject: {
            classroom: {
                teacherId: session.user.id
            }
        }
    };

    if (startDate && endDate) {
        whereClause.date = {
            gte: startDate,
            lte: endDate
        };
    }
    
    return getLessonsWithRecords(whereClause);
}

export async function getLessonsForClass(classId: string, startDate?: string, endDate?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const whereClause: Prisma.LessonWhereInput = {
        classId,
        classroom: {
            teacherId: session.user.id
        }
    };

    if (startDate && endDate) {
        whereClause.date = {
            gte: startDate,
            lte: endDate
        };
    }
    
    return getLessonsWithRecords(whereClause);
}


export async function createLesson(data: { date: string, subjectId: string, classId: string }): Promise<Lesson> {
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
        
    const createdLessonsWithRecords = await getLessonsWithRecords({ id: newLesson.id });

    if (createdLessonsWithRecords.length === 0) {
        throw new Error("Could not find created lesson with records");
    }

    return createdLessonsWithRecords[0];
}

export async function updateLesson(id: string, data: Partial<Omit<PrismaLesson, 'id'>> & { records?: Partial<LessonRecord>[] }): Promise<Lesson> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const { records, ...lessonData } = data;
    
    // Transaction to ensure data integrity
    const transactionOperations = [];

    // If there's other lesson data to update, add it to the transaction
    if (Object.keys(lessonData).length > 0) {
        transactionOperations.push(
            db.lesson.update({
                where: { id },
                data: lessonData,
            })
        );
    }
    
    // If there are records to update, add them to the transaction
    if (records && Array.isArray(records)) {
        for (const record of records) {
            if (record.id) {
                const { id: recordId, ...recordData } = record;
                 // Ensure grade is number or null, not an empty string
                if (recordData.grade === '') {
                    recordData.grade = null;
                }
                transactionOperations.push(
                    db.lessonRecord.update({
                        where: { id: recordId },
                        data: recordData
                    })
                );
            }
        }
    }
    
    // Execute all updates in a single transaction
    if (transactionOperations.length > 0) {
        await db.$transaction(transactionOperations);
    }

    const updatedLessonsWithRecords = await getLessonsWithRecords({ id });
    
    if (updatedLessonsWithRecords.length === 0) {
        throw new Error("Could not find updated lesson with records");
    }

    return updatedLessonsWithRecords[0];
}

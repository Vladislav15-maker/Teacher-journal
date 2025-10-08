
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Prisma, Lesson as PrismaLesson, LessonRecord as PrismaLessonRecord } from "@prisma/client";
import type { Lesson } from "@/lib/types";

// This is a more robust way to handle fetching lessons with their records.
async function getLessonsWithRecords(where: Prisma.LessonWhereInput): Promise<Lesson[]> {
    const lessons = await db.lesson.findMany({
        where,
        orderBy: {
            date: 'asc'
        }
    });

    if (lessons.length === 0) {
        return [];
    }

    const lessonIds = lessons.map(l => l.id);
    const records = await db.lessonRecord.findMany({
        where: {
            lessonId: { in: lessonIds }
        }
    });

    const recordsByLessonId = new Map<string, PrismaLessonRecord[]>();
    records.forEach(record => {
        const existing = recordsByLessonId.get(record.lessonId) || [];
        existing.push(record);
        recordsByLessonId.set(record.lessonId, existing);
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
    
    // First, verify the teacher has access to this subject
    const subject = await db.subject.findFirst({
        where: {
            id: subjectId,
            classroom: {
                teacherId: session.user.id
            }
        }
    });

    if (!subject) {
        throw new Error("Subject not found or unauthorized");
    }

    const whereClause: Prisma.LessonWhereInput = {
        subjectId,
    };
    
    // Fetch all lessons and filter in code, as Prisma has issues with GTE/LTE on string dates.
    const allLessons = await getLessonsWithRecords(whereClause);

    if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return allLessons.filter(lesson => {
            const lessonDate = new Date(lesson.date).getTime();
            return lessonDate >= start && lessonDate <= end;
        });
    }
    
    return allLessons;
}

export async function getLessonsForClass(classId: string, startDate?: string, endDate?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // First, verify the teacher has access to this class
    const classroom = await db.class.findFirst({
        where: {
            id: classId,
            teacherId: session.user.id
        }
    });

    if (!classroom) {
        throw new Error("Class not found or unauthorized");
    }

    const whereClause: Prisma.LessonWhereInput = {
        classId,
    };

    // Fetch all lessons and filter in code
    const allLessons = await getLessonsWithRecords(whereClause);
    
    if (startDate && endDate) {
         const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        return allLessons.filter(lesson => {
            const lessonDate = new Date(lesson.date).getTime();
            return lessonDate >= start && lessonDate <= end;
        });
    }
    
    return allLessons;
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
        // This should not happen, but as a fallback, return the lesson without records
        return { ...newLesson, records: [] };
    }

    return createdLessonsWithRecords[0];
}

export async function updateLesson(id: string, data: Partial<Omit<PrismaLesson, 'id' | 'records'>> & { records?: Partial<PrismaLessonRecord>[] }): Promise<Lesson> {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const { records, ...lessonData } = data;
    
    // Use a transaction to ensure all or nothing is updated
    await db.$transaction(async (tx) => {
        // 1. Update the lesson data itself if provided
        if (Object.keys(lessonData).length > 0) {
            await tx.lesson.update({
                where: { id },
                data: lessonData,
            });
        }
    
        // 2. Update the records if provided
        if (records && Array.isArray(records)) {
            for (const record of records) {
                if (record.id) {
                    const { id: recordId, ...recordData } = record;
                     // Ensure grade is number or null, not an empty string
                    if (recordData.grade === '' || recordData.grade === undefined) {
                        recordData.grade = null;
                    }
                    await tx.lessonRecord.update({
                        where: { id: recordId },
                        data: recordData,
                    });
                }
            }
        }
    });

    const updatedLessonsWithRecords = await getLessonsWithRecords({ id });
    
    if (updatedLessonsWithRecords.length === 0) {
        throw new Error("Could not find updated lesson with records");
    }

    return updatedLessonsWithRecords[0];
}

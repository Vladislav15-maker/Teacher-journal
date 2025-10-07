
import type { Class as PrismaClass, Student as PrismaStudent, Subject as PrismaSubject, Lesson as PrismaLesson, Message as PrismaMessage, User as PrismaUser, LessonRecord as PrismaLessonRecord } from '@prisma/client';

export type LessonRecord = PrismaLessonRecord;

export type Student = PrismaStudent;

// This is the base Class type from Prisma
export type Class = PrismaClass;

// This is a new, explicit type for a Class that includes its relations
export type ClassWithRelations = PrismaClass & {
  students: Student[];
  subjects: Subject[];
};

export type Subject = PrismaSubject;

export type Lesson = PrismaLesson & {
    records: LessonRecord[];
};

export type Teacher = PrismaUser;

export type Message = PrismaMessage & {
    sender?: PrismaUser,
};


export type AttendanceStatus = 'present' | 'absent' | 'excused';

export type LessonType = 'classwork' | 'independent' | 'project' | 'sor' | 'soch';

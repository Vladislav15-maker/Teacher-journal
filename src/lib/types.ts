
import type { Class as PrismaClass, Student as PrismaStudent, Subject as PrismaSubject, Lesson as PrismaLesson, Message as PrismaMessage, User as PrismaUser, LessonRecord as PrismaLessonRecord } from '@prisma/client';

export type LessonRecord = PrismaLessonRecord;

export type Student = PrismaStudent & {
    records: LessonRecord[];
};

export type Class = PrismaClass;
export type Subject = PrismaSubject;
export type Lesson = Omit<PrismaLesson, 'records'> & {
    records: LessonRecord[];
};
export type Teacher = PrismaUser;
export type Message = PrismaMessage & {
    sender?: PrismaUser,
};


export type AttendanceStatus = 'present' | 'absent' | 'excused';

export type LessonType = 'classwork' | 'independent' | 'project' | 'sor' | 'soch';

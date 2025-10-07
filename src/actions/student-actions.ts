
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Student } from "@prisma/client";

export async function getStudents(classroomId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return await db.student.findMany({
    where: {
      classroomId,
      classroom: {
        teacherId: session.user.id
      }
    },
    orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
    ]
  });
}

export async function createStudent(classroomId: string, data: Omit<Student, 'id' | 'classroomId'>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify the user owns the class
  const classroom = await db.class.findFirst({
      where: { id: classroomId, teacherId: session.user.id }
  });
  if (!classroom) {
      throw new Error("Class not found or unauthorized");
  }
  
  const { records, ...studentData } = data as any;

  return await db.student.create({
    data: {
      ...studentData,
      classroomId,
    },
  });
}

export async function updateStudent(id: string, data: Partial<Omit<Student, 'id'>>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    const { records, ...studentData } = data as any;

    return await db.student.update({
        where: { id },
        data: studentData,
    });
}

export async function deleteStudent(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    
    return await db.student.delete({
        where: { id },
    });
}

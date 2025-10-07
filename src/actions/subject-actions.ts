
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import type { Subject } from "@prisma/client";

export async function getSubjects(classId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return await db.subject.findMany({
    where: {
      classId,
      class: {
          teacherId: session.user.id
      }
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function createSubject(classId: string, data: Omit<Subject, 'id' | 'classId'>) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const classroom = await db.class.findFirst({
      where: { id: classId, teacherId: session.user.id }
  });

  if (!classroom) {
      throw new Error("Class not found or unauthorized");
  }

  return await db.subject.create({
    data: {
      ...data,
      classId,
    },
  });
}

export async function updateSubject(id: string, data: Partial<Omit<Subject, 'id'>>) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    return await db.subject.update({
        where: { id },
        data,
    });
}

export async function deleteSubject(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }
    
    return await db.subject.delete({
        where: { id },
    });
}


'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getClasses() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return await db.class.findMany({
    where: {
      teacherId: session.user.id,
    },
    include: {
      students: true,
      subjects: true,
    },
    orderBy: {
      name: 'asc'
    }
  });
}

export async function createClass(name: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return await db.class.create({
    data: {
      name,
      teacherId: session.user.id,
    },
     include: {
      students: true,
      subjects: true,
    }
  });
}

export async function updateClass(id: string, name: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    return await db.class.update({
        where: { id, teacherId: session.user.id },
        data: { name },
        include: {
          students: true,
          subjects: true,
        }
    });
}

export async function deleteClass(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    // Use a transaction to delete related subjects and students first
    return await db.$transaction(async (tx) => {
      await tx.subject.deleteMany({
        where: { classId: id },
      });
      await tx.student.deleteMany({
        where: { classroomId: id },
      });
      await tx.lesson.deleteMany({
        where: { classId: id },
      });
      return await tx.class.delete({
          where: { id, teacherId: session.user.id },
      });
    });
}

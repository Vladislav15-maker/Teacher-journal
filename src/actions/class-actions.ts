
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

    // Use a transaction to delete related entities in the correct order
    return await db.$transaction(async (tx) => {
      // First, delete LessonRecords associated with the lessons of the class
      await tx.lessonRecord.deleteMany({
        where: {
          lesson: {
            classId: id,
          },
        },
      });
      // Then, delete the lessons
      await tx.lesson.deleteMany({
        where: { classId: id },
      });
      // Then, delete subjects and students
      await tx.subject.deleteMany({
        where: { classId: id },
      });
      await tx.student.deleteMany({
        where: { classroomId: id },
      });
      
      // Finally, delete the class itself
      return await tx.class.delete({
          where: { id, teacherId: session.user.id },
      });
    });
}

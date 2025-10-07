
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getMessages(classroomId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    return await db.message.findMany({
        where: {
            classroomId,
            classroom: {
                teacherId: session.user.id
            }
        },
        orderBy: {
            timestamp: 'desc'
        }
    });
}

export async function createMessage(data: { senderId: string, studentId: string | null, classroomId: string, text: string }) {
    const session = await auth();
    if (!session?.user?.id || session.user.id !== data.senderId) {
        throw new Error("Unauthorized");
    }

    return await db.message.create({
        data: {
            text: data.text,
            classroomId: data.classroomId,
            studentId: data.studentId,
            senderId: data.senderId,
        }
    });
}

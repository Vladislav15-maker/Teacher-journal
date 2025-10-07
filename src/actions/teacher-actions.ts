
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function getTeacherProfile() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    return await db.user.findUnique({
        where: { id: session.user.id }
    });
}

export async function updateTeacherProfile(data: { firstName: string, lastName: string }) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    return await db.user.update({
        where: { id: session.user.id },
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            name: `${data.firstName} ${data.lastName}`
        }
    });
}

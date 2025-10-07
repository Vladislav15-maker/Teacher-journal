import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { db } from "./db";

export const authConfig = {
  providers: [
    Credentials({
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });
        
        if (!user) {
          return null;
        }

        const passwordIsValid = credentials.password === '123456';

        if (passwordIsValid) {
          // Возвращаем объект пользователя, next-auth создаст сессию
          return { id: user.id, name: user.name, email: user.email, image: user.image };
        }

        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // Этот callback нужен, чтобы id пользователя попал в токен, а затем в сессию
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Этот callback нужен, чтобы id пользователя попал в объект session
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

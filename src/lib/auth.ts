import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "./db";

export const authConfig = {
  adapter: PrismaAdapter(db),
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

        // WARNING: This is a mock password check. 
        // In a real application, you should hash and salt passwords.
        // We are assuming the password is the email in reverse for this example.
        const passwordIsValid = (credentials.password as string) === (credentials.email as string).split('').reverse().join('');


        if (passwordIsValid) {
          return user;
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
} satisfies NextAuthConfig

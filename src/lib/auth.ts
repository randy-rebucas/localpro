import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { API_BASE_URL } from "./api";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "Phone", type: "text" },
        code: { label: "Verification Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone) {
          throw new Error("Phone number is required");
        }

        if (!credentials?.code) {
          throw new Error("Verification code is required");
        }

        try {
          const response = await fetch(`${API_BASE_URL}/api/auth/verify-code`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phone: credentials.phone,
              code: credentials.code,
              type: "phone",
            }),
          });

          if (!response.ok) {
            throw new Error("Invalid verification code");
          }

          const user = await response.json();
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          throw new Error("Authentication failed");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.phone = user.phone;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.phone = token.phone as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
  },
};

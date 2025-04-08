// lib/auth.ts

import NextAuth from "next-auth";
import { NextAuthOptions } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "instagram",
      name: "Instagram",
      type: "oauth",
      version: "2.0",
      authorization: {
        url: "https://api.instagram.com/oauth/authorize",
        params: {
          response_type: "code",
          client_id: process.env.INSTAGRAM_CLIENT_ID!,
          redirect_uri: "http://localhost:3000/api/auth/callback/instagram",
          scope: "user_profile,user_media",
        },
      },
      token: "https://api.instagram.com/oauth/access_token",
      userinfo: {
        url: "https://graph.instagram.com/me",
        params: { fields: "id,username" },
      },
      clientId: process.env.INSTAGRAM_CLIENT_ID!,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.id,
          name: profile.username,
          email: null, // Instagram does not provide email
          image: null, // Instagram does not provide profile pictures
        };
      },
    },
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin", // Your custom sign-in page if you have one
  },
};


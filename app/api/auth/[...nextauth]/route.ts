import NextAuth from "next-auth";
import Auth0Provider from "next-auth/providers/auth0";

const handler = NextAuth({
  providers: [
    Auth0Provider({
      clientId: process.env.AUTH0_CLIENT_ID ?? "",
      clientSecret: process.env.AUTH0_CLIENT_SECRET ?? "",
      issuer: process.env.AUTH0_ISSUER ?? "",
      authorization: {
        params: {
          audience: process.env.AUTH0_AUDIENCE,
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async signIn({ user, profile }) {
      console.log("user", user);
      console.log("profile", profile);

      return true;
    },
    async session({ session, token }) {
      if (typeof token.accessToken === "string") {
        session.access_token = token.accessToken;
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
});

export { handler as GET, handler as POST };

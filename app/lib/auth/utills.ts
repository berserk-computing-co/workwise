import {getServerSession} from "next-auth";

export const getAccessToken = async () => {
  const session = await getServerSession({
    callbacks: {
      async session({ session, token }) {
        if (typeof token.accessToken === "string") {
          session.access_token = token.accessToken;
        }
        return session;
      },
    },
  });

  return session?.access_token;
};

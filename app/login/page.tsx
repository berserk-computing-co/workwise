import React, { useEffect } from 'react';
import { StytchLogin, useStytchUser } from "@stytch/nextjs"
import { Products } from "@stytch/vanilla-js";
import { useRouter } from 'next/router';

const REDIRECT_URL = "SEE_STEP_5";

const config = {
  products: [Products.emailMagicLinks, Products.oauth],
  emailMagicLinksOptions: {
    loginRedirectURL: REDIRECT_URL,
    loginExpirationMinutes: 60,
    signupRedirectURL: REDIRECT_URL,
    signupExpirationMinutes: 60,
  },
  oauthOptions: {
    providers: [{ type: "google" }],
    loginRedirectURL: REDIRECT_URL,
    signupRedirectURL: REDIRECT_URL,
  },
};


export default function Login() {
  const { user, isInitialized } = useStytchUser();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && user) {
      router.replace("/profile");
    }
  }, [user, isInitialized, router]);

  return <StytchLogin config={config} />;
}
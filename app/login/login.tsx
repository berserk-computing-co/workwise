import { StytchLogin } from "@stytch/nextjs";
import { Products } from "@stytch/vanilla-js";

export const Login = () => {
  const REDIRECT_URL = "http://localhost:4000/bids";

  const config = {
    products: [Products.emailMagicLinks, Products.oauth],
    emailMagicLinksOptions: {
      loginRedirectURL: REDIRECT_URL,
      loginExpirationMinutes: 60,
      signupRedirectURL: REDIRECT_URL,
      signupExpirationMinutes: 60,
    },
  };
  return <StytchLogin config={config} />;
};
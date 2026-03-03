import React from "react";
import type { Preview, Decorator } from "@storybook/react";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import { initialize, mswLoader } from "msw-storybook-addon";
import { ThemeProvider } from "@/app/lib/theme/context";
import { ToastProvider } from "@/app/components/toast";
import { handlers } from "./mocks/handlers";
import "../../web/app/globals.css";

// Initialize MSW
initialize({
  onUnhandledRequest: "bypass",
  serviceWorker: {
    url: "/mockServiceWorker.js",
  },
});

const defaultAuth0User = {
  sub: "auth0|storybook",
  name: "Storybook User",
  email: "storybook@workwise.io",
  picture: "https://avatars.githubusercontent.com/u/1?v=4",
};

const withProviders: Decorator = (Story, context) => {
  // Read auth user from story parameters (supports parameters.nextjs.auth.user)
  // If not set, use a default user. If explicitly null, user is unauthenticated.
  const nextjs = context.parameters.nextjs as
    | { auth?: { user?: object | null } }
    | undefined;
  const user = nextjs?.auth !== undefined ? nextjs.auth.user : defaultAuth0User;
  return (
    <UserProvider user={user}>
      <ThemeProvider>
        <ToastProvider>
          <Story />
        </ToastProvider>
      </ThemeProvider>
    </UserProvider>
  );
};

const preview: Preview = {
  decorators: [withProviders],
  loaders: [mswLoader],
  parameters: {
    msw: {
      handlers,
    },
    nextjs: {
      appDirectory: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#ffffff" },
        { name: "dark", value: "#0f0f12" },
      ],
    },
  },
};

export default preview;

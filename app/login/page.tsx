'use client'

import React, { useEffect } from 'react';
import { useStytchUser } from "@stytch/nextjs"
import { Login } from './login';
import { useRouter } from 'next/router';

export default function LoginPage() {
  const { user, isInitialized } = useStytchUser();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && user) {
      router.replace('/bids')
    }
  }, [user, isInitialized]);

  return <Login />;
}
"use client";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { Card } from "flowbite-react";

export default function Home() {
  return (
    <Card>
      <div className="flex justify-center mb-5">
        <Image src="/workwise.png" width="600" height="300" alt={""} />
      </div>
      <div className="flex-1 text-center">
        <button
          onClick={() => signIn("Credentials", { callbackUrl: "/bids" })}
          className="bg-blue-400 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Login to WorkWise
        </button>
      </div>
    </Card>
  );
}

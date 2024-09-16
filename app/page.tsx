"use client";

import React from "react";
import Image from "next/image";
import { Card } from "flowbite-react";

export default function Home() {
  return (
    <Card>
      <div className="flex justify-center mb-5">
        <Image src="/workwise.png" width="600" height="300" alt={""} />
      </div>
    </Card>
  );
}

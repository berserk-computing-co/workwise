"use client";

import { BidGenerator } from "@/app/components/bid_generator";

export default function WidgetPage() {
  return (
    <div className="flex items-start justify-center min-h-screen bg-transparent p-4">
      <BidGenerator />
    </div>
  );
}

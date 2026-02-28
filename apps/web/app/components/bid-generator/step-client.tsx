"use client";

import { useEffect, useRef, useState } from "react";
import { BotCard } from "./bot-card";

export function Step3Client({
  onNext,
  onSkip,
}: {
  onNext: (payload: { clientName: string }) => void;
  onSkip: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onNext({ clientName: clientName.trim() });
    }
  };

  return (
    <div className="space-y-3">
      <BotCard
        title="Who's the client?"
        subtitle="Optional — you can add this later."
      />
      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Client name"
          className="w-full bg-white dark:bg-[#0f0f12] border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 transition-colors"
        />
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-sm text-gray-400 hover:text-gray-600 focus:outline-none rounded transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => onNext({ clientName: clientName.trim() })}
            className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

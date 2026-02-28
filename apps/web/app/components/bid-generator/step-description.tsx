"use client";

import React, { useEffect, useRef, useState } from "react";
import { BotCard } from "./bot-card";
import { CATEGORIES } from "./types";

export function Step2Description({
  onNext,
}: {
  onNext: (payload: { description: string; category: string | null }) => void;
}) {
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleCategoryToggle = (cat: string) => {
    setCategory((prev) => (prev === cat ? null : cat));
  };

  const canContinue = description.trim().length >= 20;

  const handleSubmit = () => {
    if (!canContinue) return;
    onNext({ description: description.trim(), category });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canContinue) {
      handleSubmit();
    }
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="space-y-3">
      <BotCard
        title="What work needs to be done?"
        subtitle="Be as detailed as you can — it helps us generate a more accurate estimate."
      />
      <div className="space-y-3">
        <textarea
          ref={textareaRef}
          value={description}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          placeholder={
            category
              ? `Describe the ${category.toLowerCase()} work — what specifically needs to be done...`
              : "Describe the project — what rooms, what kind of work, any specific materials or requirements..."
          }
          rows={3}
          className="w-full bg-white dark:bg-[#0f0f12] border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10 overflow-hidden transition-all"
          style={{ minHeight: "80px", maxHeight: "200px" }}
        />

        {/* Category chips */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryToggle(cat)}
              className={`rounded-full px-3 py-1.5 text-sm border transition-colors cursor-pointer ${
                category === cat
                  ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {description.trim().length < 20
              ? `${20 - description.trim().length} more characters needed`
              : "Press ⌘↵ or click Continue"}
          </p>
          <button
            onClick={handleSubmit}
            disabled={!canContinue}
            className="rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

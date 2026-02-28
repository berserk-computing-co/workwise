import { BotCard } from "./bot-card";
import type { FlowState } from "./types";

export function Step4Summary({
  state,
  isLoggedIn,
  onSaveDraft,
  onGenerate,
  submitting,
}: {
  state: FlowState;
  isLoggedIn: boolean;
  onSaveDraft: () => void;
  onGenerate: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-3">
      <BotCard
        title={isLoggedIn ? "Ready to go!" : "Looking good!"}
        subtitle={
          isLoggedIn
            ? "Review your project details below."
            : "Sign up to generate your estimate."
        }
      />
      <div className="bg-gray-50 dark:bg-[#1a1a1e] rounded-xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
              Address
            </p>
            <p className="text-gray-800 dark:text-gray-200">
              {state.formattedAddress}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
              Description
            </p>
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {state.description}
            </p>
          </div>
          {state.category && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                Category
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                {state.category}
              </p>
            </div>
          )}
          {state.clientName && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">
                Client
              </p>
              <p className="text-gray-800 dark:text-gray-200">
                {state.clientName}
              </p>
            </div>
          )}
        </div>

        <div className="pt-1 flex flex-col sm:flex-row gap-3">
          {isLoggedIn ? (
            <>
              <button
                onClick={onSaveDraft}
                disabled={submitting}
                className="flex-1 rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={onGenerate}
                disabled={submitting}
                className="flex-1 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                {submitting ? "Creating..." : "Generate Estimate"}
              </button>
            </>
          ) : (
            <a
              href="/api/auth/login"
              className="flex-1 inline-flex items-center justify-center rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-2.5 text-sm font-medium hover:opacity-80 transition-opacity"
            >
              Sign up to Generate
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

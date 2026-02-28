export function LockedAnswerCard({
  label,
  value,
  onEdit,
}: {
  label?: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white dark:bg-[#0f0f12] rounded-xl p-5 border border-gray-100 dark:border-gray-800 ml-6 flex items-start justify-between gap-3">
      <div>
        {label && (
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">
            {label}
          </p>
        )}
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">
          {value}
        </p>
      </div>
      <button
        onClick={onEdit}
        className="flex-shrink-0 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none rounded transition-colors"
      >
        Change
      </button>
    </div>
  );
}

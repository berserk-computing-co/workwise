export function BotCard({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-gray-50 dark:bg-[#1a1a1e] rounded-xl p-5 border border-gray-100 dark:border-gray-800 flex gap-3">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm select-none">
        ✦
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-gray-100">{title}</p>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

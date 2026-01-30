export default function ProgressBar({ percentage }) {
  return (
    <div className="mb-4 shrink-0">
      <div className="h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800">
        <div
          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs font-medium text-stone-500 dark:text-stone-400">
        {Math.round(percentage)}% Complete
      </p>
    </div>
  );
}

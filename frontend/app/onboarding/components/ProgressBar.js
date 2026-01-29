export default function ProgressBar({ percentage }) {
  return (
    <div className="mb-8">
      <div className="h-3 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-purple-600 to-blue-600 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-2 text-right text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {Math.round(percentage)}% Complete
      </p>
    </div>
  );
}

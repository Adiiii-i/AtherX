export default function TypingIndicator({ label }) {
  return (
    <div className="flex justify-start animate-fade-in py-1">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-surface-800/60 border border-surface-700/30 px-4 py-2.5">
        {label && (
          <span className="text-[10px] font-semibold text-stone-200/70">{label}</span>
        )}
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce-dot"
            style={{ animationDelay: '0s' }}
          />
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce-dot"
            style={{ animationDelay: '0.16s' }}
          />
          <span
            className="inline-block h-1.5 w-1.5 rounded-full bg-slate-500 animate-bounce-dot"
            style={{ animationDelay: '0.32s' }}
          />
        </div>
      </div>
    </div>
  );
}

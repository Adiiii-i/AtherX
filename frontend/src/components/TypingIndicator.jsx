export default function TypingIndicator({ label }) {
  return (
    <div className="flex justify-start animate-fade-in py-1">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-burgundy-900/10 border border-sand-400/10 px-4 py-2.5">
        {label && (
          <span className="text-[10px] font-bold text-sand-400/60 uppercase tracking-tighter">{label}</span>
        )}
        <div className="flex items-center gap-1">
          <span
            className="inline-block h-1 w-1 rounded-full bg-sand-400 animate-bounce-dot"
            style={{ animationDelay: '0s' }}
          />
          <span
            className="inline-block h-1 w-1 rounded-full bg-sand-400 animate-bounce-dot"
            style={{ animationDelay: '0.16s' }}
          />
          <span
            className="inline-block h-1 w-1 rounded-full bg-sand-400 animate-bounce-dot"
            style={{ animationDelay: '0.32s' }}
          />
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Check, CheckCheck, Flame } from 'lucide-react';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, showTimestamp, onBurn }) {
  const isSent = message.type === 'sent';
  const [burnTimer, setBurnTimer] = useState(null);

  // Auto-burn received burn messages after 10 seconds
  useEffect(() => {
    if (message.burn && !message.burned && message.type === 'received' && onBurn) {
      const t = setTimeout(onBurn, 10_000);
      setBurnTimer(10);
      const interval = setInterval(() => setBurnTimer((v) => (v > 0 ? v - 1 : 0)), 1000);
      return () => {
        clearTimeout(t);
        clearInterval(interval);
      };
    }
  }, [message.burn, message.burned, message.type, onBurn]);

  return (
    <div
      className={`flex ${isSent ? 'justify-end' : 'justify-start'} message-enter ${
        message.burned ? 'burn-message' : ''
      }`}
    >
      <div
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 ${
          isSent
            ? 'bg-stone-500/90 text-white rounded-br-md'
            : 'bg-surface-800/80 text-slate-200 rounded-bl-md border border-surface-700/50'
        }`}
      >
        {/* Peer label */}
        {!isSent && message.label && (
          <p className="mb-0.5 text-[10px] font-semibold text-stone-200/80">
            {message.label}
          </p>
        )}

        {/* Message text */}
        <p className="message-text text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </p>

        {/* Footer: time + status */}
        <div className={`mt-1 flex items-center gap-1.5 ${isSent ? 'justify-end' : 'justify-start'}`}>
          {/* Burn indicator */}
          {message.burn && !message.burned && (
            <span className="flex items-center gap-0.5 text-[10px] text-stone-200/80">
              <Flame className="h-2.5 w-2.5" />
              {burnTimer !== null && `${burnTimer}s`}
            </span>
          )}

          {/* Timestamp */}
          {showTimestamp && message.timestamp && (
            <span className={`text-[10px] ${isSent ? 'text-white/40' : 'text-slate-500'}`}>
              {formatTime(message.timestamp)}
            </span>
          )}

          {/* Seen indicator */}
          {isSent && (
            <span className={`${message.seen ? 'text-stone-200/80' : 'text-white/30'}`}>
              {message.seen ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

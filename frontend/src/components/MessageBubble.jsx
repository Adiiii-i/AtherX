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
        className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm ${
          isSent
            ? 'bg-sand-400 text-burgundy-950 rounded-br-md font-medium'
            : 'bg-burgundy-900/40 text-sand-100 rounded-bl-md border border-sand-400/10'
        }`}
      >
        {/* Peer label */}
        {!isSent && message.label && (
          <p className="mb-0.5 text-[10px] font-bold text-sand-400/80 uppercase tracking-tight">
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
            <span className={`flex items-center gap-0.5 text-[10px] ${isSent ? 'text-burgundy-950/60' : 'text-sand-400/80'}`}>
              <Flame className="h-2.5 w-2.5" />
              {burnTimer !== null && `${burnTimer}s`}
            </span>
          )}

          {/* Timestamp */}
          {showTimestamp && message.timestamp && (
            <span className={`text-[10px] ${isSent ? 'text-burgundy-950/50' : 'text-sand-700/60'}`}>
              {formatTime(message.timestamp)}
            </span>
          )}

          {/* Seen indicator */}
          {isSent && (
            <span className={`${message.seen ? 'text-burgundy-900' : 'text-burgundy-950/20'}`}>
              {message.seen ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

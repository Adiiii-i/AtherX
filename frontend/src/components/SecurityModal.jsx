import { X, Lock, Hash, Eye, Server, Flame, Shield } from 'lucide-react';

const SECTIONS = [
  {
    icon: Lock,
    title: 'AES-256-GCM Encryption',
    color: 'text-sand-400',
    desc: 'Every message is encrypted on your device before it leaves. We use AES-256-GCM — the same standard used by banks and governments — via your browser\'s built-in Web Crypto API.',
  },
  {
    icon: Hash,
    title: 'Key in the Link',
    color: 'text-sand-400',
    desc: 'The encryption key is embedded in the URL after the # symbol (the "hash fragment"). Browsers never send this part to the server, so the key stays between you and whoever you share the link with.',
  },
  {
    icon: Server,
    title: 'Zero-Knowledge Server',
    color: 'text-sand-400',
    desc: 'The server only relays opaque encrypted blobs. It never sees your plaintext messages, never stores them, and never has access to encryption keys. Message logging is completely disabled.',
  },
  {
    icon: Flame,
    title: 'Ephemeral by Design',
    color: 'text-sand-400',
    desc: 'Rooms auto-delete when both users leave or after the configured TTL. There are no databases, no message history, no backups. Once gone, messages are irrecoverable.',
  },
  {
    icon: Eye,
    title: 'No Tracking',
    color: 'text-sand-600',
    desc: 'No accounts, no cookies, no analytics, no fingerprinting. We don\'t know who you are, what you said, or that you were ever here.',
  },
  {
    icon: Shield,
    title: 'Open & Auditable',
    color: 'text-sand-400',
    desc: 'All encryption happens in client-side JavaScript you can inspect. Open your browser\'s DevTools, read the source, and verify the security claims yourself.',
  },
];

export default function SecurityModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 glass rounded-2xl p-6 max-w-lg w-full max-h-[85dvh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-sand-100 flex items-center gap-2">
            <Shield className="h-5 w-5 text-sand-400" />
            How Your Chat is Protected
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-sand-700/60 hover:text-sand-400 hover:bg-burgundy-900/40 transition-colors"
            id="close-security-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {SECTIONS.map((s, i) => (
            <div
              key={s.title}
              className="flex gap-3 animate-slide-up"
              style={{ animationDelay: `${i * 0.07}s` }}
            >
              <div className={`mt-0.5 flex-shrink-0 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-sand-300 mb-1">{s.title}</h3>
                <p className="text-xs text-sand-700/60 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-burgundy-950/20 border border-sand-400/10 px-4 py-3">
          <p className="text-xs text-sand-700/60 leading-relaxed">
            <strong>Bottom line:</strong> Even if someone intercepted every packet between you and the server,
            they'd see nothing but random noise. Only someone with the shared link can read your messages.
          </p>
        </div>
      </div>
    </div>
  );
}

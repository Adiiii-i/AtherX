import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Lock, Zap, Timer, ArrowRight,
  Copy, Check, QrCode, Eye, Sparkles, X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { generateKey, exportKey } from '../utils/crypto';
import SecurityModal from '../components/SecurityModal';

const API_URL = import.meta.env.VITE_API_URL || '';

const TTL_OPTIONS = [
  { value: 300,   label: '5 min',  desc: 'Quick chat' },
  { value: 900,   label: '15 min', desc: 'Brief talk' },
  { value: 3600,  label: '1 hr',   desc: 'Standard' },
  { value: 86400, label: '24 hrs', desc: 'Extended' },
];

export default function Home() {
  const navigate = useNavigate();
  const [joinInput, setJoinInput] = useState('');
  const [ttl, setTtl] = useState(86400);
  const [creating, setCreating] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [error, setError] = useState('');

  // Post-creation state
  const [createdRoom, setCreatedRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  /* ── Create Room ──────────────────────────────────────── */
  const handleCreate = useCallback(async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ttl }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create room');
      }
      const { roomId } = await res.json();

      // Generate E2EE key on client
      const key = await generateKey();
      const keyStr = await exportKey(key);
      const link = `${window.location.origin}/chat/${roomId}#key=${keyStr}`;

      setCreatedRoom({ roomId, link, keyStr });
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }, [ttl]);

  /* ── Join Room ────────────────────────────────────────── */
  const handleJoin = useCallback(() => {
    setError('');
    const input = joinInput.trim();
    if (!input) return;

    // Full URL
    if (input.startsWith('http')) {
      try {
        const url = new URL(input);
        const path = url.pathname + url.hash;
        navigate(path);
        return;
      } catch {
        setError('Invalid link format');
        return;
      }
    }

    // Room code (e.g., X7K-29P)
    const code = input.toUpperCase().replace(/\s/g, '');
    if (/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(code)) {
      navigate(`/chat/${code}`);
      return;
    }

    setError('Enter a valid room link or code (e.g., X7K-29P)');
  }, [joinInput, navigate]);

  /* ── Copy link ────────────────────────────────────────── */
  const copyLink = useCallback(async () => {
    if (!createdRoom) return;
    await navigator.clipboard.writeText(createdRoom.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [createdRoom]);

  /* ── Enter room after creation ────────────────────────── */
  const enterRoom = useCallback(() => {
    if (!createdRoom) return;
    navigate(`/chat/${createdRoom.roomId}#key=${createdRoom.keyStr}`);
  }, [createdRoom, navigate]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        
        {/* ── Hero ──────────────────────────────────────── */}
        <div className="mb-10 text-center animate-fade-in">
          <div className="mb-8 inline-flex relative z-10 items-center justify-center rounded-3xl bg-burgundy-900/40 border border-sand-400/20 p-5 shadow-2xl hero-glow">
            <Lock className="h-8 w-8 text-sand-400 drop-shadow-[0_0_10px_rgba(241,225,148,0.4)]" />
            <div className="hero-ring" />
          </div>
          <h1 className="mb-2 text-4xl font-extrabold tracking-tight">
            <span className="gradient-text">AtherX</span>
          </h1>
          <p className="text-sm font-medium text-sand-600/70 tracking-wide uppercase">
            Ephemeral Encrypted Chat
          </p>
          <p className="mt-3 text-sand-900/50 text-sm leading-relaxed max-w-xs mx-auto">
            Your messages vanish into thin air. No accounts. No tracking. No traces.
          </p>
        </div>

        {/* ── Created Room Modal ────────────────────────── */}
        {createdRoom ? (
          <div className="animated-border feature-card p-6 animate-scale-in">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-100">Room Created</h2>
              <span className="badge-success">
                <Shield className="h-3 w-3" /> Encrypted
              </span>
            </div>

            {/* Room code display */}
            <div className="mb-4 rounded-xl bg-burgundy-950/40 py-4 text-center border border-sand-400/10">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-sand-700/60">
                Room Code
              </p>
              <p className="font-mono text-3xl font-bold tracking-widest text-sand-400">
                {createdRoom.roomId}
              </p>
            </div>

            {/* Share link */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Secure Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdRoom.link}
                  className="input-field flex-1 font-mono text-xs text-slate-400"
                  id="share-link"
                />
                <button
                  onClick={copyLink}
                  className="btn-secondary flex items-center gap-1.5 px-4 text-sm"
                  id="copy-link-btn"
                >
                  {copied ? <Check className="h-4 w-4 text-sand-400" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* QR toggle */}
            <button
              onClick={() => setShowQR(!showQR)}
              className="mb-4 flex items-center gap-2 text-xs text-slate-500 hover:text-stone-200 transition-colors"
              id="qr-toggle-btn"
            >
              <QrCode className="h-3.5 w-3.5" />
              {showQR ? 'Hide' : 'Show'} QR Code
            </button>

            {showQR && (
              <div className="mb-4 flex justify-center animate-scale-in">
                <div className="rounded-xl bg-white p-3">
                  <QRCodeSVG
                    value={createdRoom.link}
                    size={180}
                    bgColor="#ffffff"
                    fgColor="#12121a"
                    level="M"
                  />
                </div>
              </div>
            )}

            {/* Enter room */}
            <button
              onClick={enterRoom}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
              id="enter-room-btn"
            >
              Enter Room
              <ArrowRight className="h-5 w-5" />
            </button>

            <p className="mt-3 text-center text-xs text-slate-600">
              Share the link above — anyone with the link can join securely.
            </p>
          </div>
        ) : (
          <>
            {/* ── Create Room Card ──────────────────────── */}
            <div className="animated-border feature-card p-6 mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              {/* TTL selector */}
              <label className="mb-2 block text-xs font-medium text-slate-500 uppercase tracking-wider">
                Room Expiry
              </label>
              <div className="mb-5 grid grid-cols-2 gap-2">
                {TTL_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTtl(opt.value)}
                    className={`rounded-lg py-2.5 px-2 text-center transition-all duration-200 ${
                      ttl === opt.value
                        ? 'bg-sand-400/20 ring-1 ring-sand-400/50 text-sand-400'
                        : 'bg-burgundy-900/20 text-sand-700/60 hover:bg-burgundy-900/40 hover:text-sand-600'
                    }`}
                    id={`ttl-${opt.value}`}
                  >
                    <Timer className="mx-auto mb-1 h-4 w-4" />
                    <span className="block text-sm font-semibold">{opt.label}</span>
                    <span className="block text-[10px] mt-0.5 opacity-70">{opt.desc}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-primary w-full flex items-center justify-center gap-2 text-base disabled:opacity-50"
                id="create-room-btn"
              >
                {creating ? (
                  <>
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Create Room
                  </>
                )}
              </button>
            </div>

            {/* ── Divider ────────────────────────────────── */}
            <div className="flex items-center gap-3 my-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
              <span className="text-xs text-slate-600 font-medium uppercase tracking-widest">or join</span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-700/50 to-transparent" />
            </div>

            {/* ── Join Room Card ─────────────────────────── */}
            <div className="animated-border feature-card p-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinInput}
                  onChange={(e) => setJoinInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  placeholder="Paste link or code (X7K-29P)"
                  className="input-field flex-1"
                  id="join-input"
                />
                <button
                  onClick={handleJoin}
                  className="btn-secondary flex items-center gap-1.5 px-5"
                  id="join-room-btn"
                >
                  <ArrowRight className="h-4 w-4" />
                  Join
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── Error toast ────────────────────────────────── */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 animate-slide-down">
            <X className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Footer badges ──────────────────────────────── */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={() => setShowSecurity(true)}
            className="badge-info cursor-pointer hover:bg-amber-500/20 transition-colors"
            id="security-info-btn"
          >
            <Eye className="h-3 w-3" />
            How it works
          </button>
          <span className="badge-success">
            <Shield className="h-3 w-3" />
            E2E Encrypted
          </span>
          <span className="badge-warning">
            <Zap className="h-3 w-3" />
            No accounts
          </span>
        </div>
      </div>

      {/* Security modal */}
      {showSecurity && <SecurityModal onClose={() => setShowSecurity(false)} />}
    </div>
  );
}

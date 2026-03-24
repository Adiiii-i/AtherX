import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send, ArrowLeft, Shield, Wifi, WifiOff,
  Flame, Clock, AlertTriangle, Copy, Check,
  XCircle, Eye, EyeOff, Lock,
} from 'lucide-react';
import { connectSocket, disconnectSocket, getSocket } from '../utils/socket';
import {
  importKey, getKeyFromHash, encryptMessage, decryptMessage,
} from '../utils/crypto';
import MessageBubble from '../components/MessageBubble';
import TypingIndicator from '../components/TypingIndicator';

export default function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimeout = useRef(null);

  /* ── State ───────────────────────────────────────────── */
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [cryptoKey, setCryptoKey] = useState(null);
  const [hasKey, setHasKey] = useState(false);
  const [myLabel, setMyLabel] = useState('');
  const [peerLabel, setPeerLabel] = useState('');
  const [userCount, setUserCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [burnMode, setBurnMode] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [peerTyping, setPeerTyping] = useState(false);
  const [copied, setCopied] = useState(false);

  /* ── Tab visibility for privacy blur ─────────────────── */
  useEffect(() => {
    const handler = () => {
      if (document.hidden && privacyMode) {
        document.getElementById('chat-area')?.classList.add('privacy-blur');
      } else {
        document.getElementById('chat-area')?.classList.remove('privacy-blur');
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [privacyMode]);

  /* ── Auto-scroll ─────────────────────────────────────── */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, peerTyping]);

  /* ── Import encryption key from hash ─────────────────── */
  useEffect(() => {
    (async () => {
      const keyStr = getKeyFromHash();
      if (keyStr) {
        try {
          const key = await importKey(keyStr);
          setCryptoKey(key);
          setHasKey(true);
        } catch {
          setError('Invalid encryption key in the link');
        }
      }
    })();
  }, []);

  /* ── Socket connection ───────────────────────────────── */
  useEffect(() => {
    const socket = connectSocket();

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', roomId, (res) => {
        if (res.error) {
          setError(res.error);
          return;
        }
        setMyLabel(res.label);
        setUserCount(res.userCount);
        if (res.peerLabel) setPeerLabel(res.peerLabel);
      });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('user-joined', ({ label, count }) => {
      setPeerLabel(label);
      setUserCount(count);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: 'system', text: `${label} joined the room`, timestamp: Date.now() },
      ]);
    });

    socket.on('user-left', ({ label, count }) => {
      setUserCount(count);
      setPeerTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: 'system', text: `${label} left the room`, timestamp: Date.now() },
      ]);
    });

    socket.on('chat-message', async (data) => {
      let text = '[encrypted]';
      if (cryptoKey) {
        try {
          text = await decryptMessage(cryptoKey, data.encrypted, data.iv);
        } catch {
          text = '[decryption failed]';
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          type: 'received',
          text,
          timestamp: data.timestamp,
          label: data.label,
          burn: data.burn,
          burned: false,
        },
      ]);

      // Auto-seen
      socket.emit('message-seen', data.id);
    });

    socket.on('typing', ({ isTyping }) => setPeerTyping(isTyping));

    socket.on('message-seen', (messageId) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, seen: true } : m))
      );
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('chat-message');
      socket.off('typing');
      socket.off('message-seen');
      disconnectSocket();
    };
  }, [roomId]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Re-bind chat-message handler when cryptoKey changes ── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = async (data) => {
      let text = '[encrypted]';
      if (cryptoKey) {
        try {
          text = await decryptMessage(cryptoKey, data.encrypted, data.iv);
        } catch {
          text = '[decryption failed]';
        }
      }
      setMessages((prev) => [
        ...prev,
        {
          id: data.id,
          type: 'received',
          text,
          timestamp: data.timestamp,
          label: data.label,
          burn: data.burn,
          burned: false,
        },
      ]);
      socket.emit('message-seen', data.id);
    };

    socket.off('chat-message');
    socket.on('chat-message', handler);

    return () => socket.off('chat-message', handler);
  }, [cryptoKey]);

  /* ── Send message ────────────────────────────────────── */
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const id = crypto.randomUUID();
    const timestamp = Date.now();

    // Encrypt
    let payload;
    if (cryptoKey) {
      try {
        const { encrypted, iv } = await encryptMessage(cryptoKey, text);
        payload = { encrypted, iv, id, burn: burnMode };
      } catch {
        setError('Encryption failed');
        return;
      }
    } else {
      // Fallback (unencrypted — should show warning)
      const raw = btoa(unescape(encodeURIComponent(text)));
      payload = { encrypted: raw, iv: '', id, burn: burnMode };
    }

    getSocket().emit('chat-message', payload);

    setMessages((prev) => [
      ...prev,
      { id, type: 'sent', text, timestamp, burn: burnMode, burned: false, seen: false },
    ]);
    setInput('');

    // Stop typing indicator
    getSocket().emit('typing', false);
    clearTimeout(typingTimeout.current);
  }, [input, cryptoKey, burnMode]);

  /* ── Typing indicator ────────────────────────────────── */
  const handleInputChange = useCallback(
    (e) => {
      setInput(e.target.value);
      const socket = getSocket();
      socket.emit('typing', true);
      clearTimeout(typingTimeout.current);
      typingTimeout.current = setTimeout(() => socket.emit('typing', false), 2000);
    },
    []
  );

  /* ── Key handler (Enter/Shift+Enter) ─────────────────── */
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  /* ── Burn handler ────────────────────────────────────── */
  const burnMessage = useCallback((msgId) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, burned: true } : m))
    );
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
    }, 1500);
  }, []);

  /* ── Copy room link ──────────────────────────────────── */
  const copyLink = useCallback(async () => {
    const link = window.location.href;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  /* ── Panic close ─────────────────────────────────────── */
  const panicClose = useCallback(() => {
    setMessages([]);
    disconnectSocket();
    navigate('/', { replace: true });
  }, [navigate]);

  /* ── Error screen ────────────────────────────────────── */
  if (error && messages.length === 0) {
    return (
      <div className="relative flex min-h-dvh flex-col items-center justify-center px-4">
        <div className="relative z-10 glass rounded-2xl p-8 max-w-sm w-full text-center animate-scale-in">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-stone-200" />
          <h2 className="mb-2 text-xl font-bold text-slate-100">Can't Join Room</h2>
          <p className="mb-6 text-sm text-slate-400">{error}</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full" id="go-home-btn">
            <ArrowLeft className="mr-2 inline h-4 w-4" />
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-dvh flex-col bg-surface-950">
      {/* ── Top Bar ──────────────────────────────────────── */}
      <header className="glass-light sticky top-0 z-20 flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="text-slate-500 hover:text-slate-300 transition-colors" id="back-btn">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-sm font-bold tracking-wider text-slate-200" id="room-code-display">
                {roomId}
              </h1>
              <button onClick={copyLink} className="text-slate-600 hover:text-stone-200 transition-colors" title="Copy link" id="copy-room-link">
                {copied ? <Check className="h-3.5 w-3.5 text-stone-200" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              {connected ? (
                <span className="flex items-center gap-1 text-stone-200">
                  <Wifi className="h-3 w-3" /> Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-stone-200">
                  <WifiOff className="h-3 w-3" /> Reconnecting…
                </span>
              )}
              <span>·</span>
              <span>{userCount}/2 users</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* E2EE indicator */}
          {hasKey && (
            <span className="badge-success text-[10px]" title="End-to-end encrypted">
              <Lock className="h-2.5 w-2.5" /> E2EE
            </span>
          )}
          {!hasKey && (
            <span className="badge-danger text-[10px]" title="No encryption key">
              <AlertTriangle className="h-2.5 w-2.5" /> No Key
            </span>
          )}

          {/* Privacy mode toggle */}
          <button
            onClick={() => setPrivacyMode(!privacyMode)}
            className={`rounded-lg p-1.5 transition-colors ${privacyMode ? 'bg-stone-500/20 text-stone-200' : 'text-slate-600 hover:text-slate-400'}`}
            title="Privacy mode (blur when tab inactive)"
            id="privacy-mode-btn"
          >
            {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>

          {/* Panic close */}
          <button
            onClick={panicClose}
            className="rounded-lg p-1.5 text-slate-600 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            title="Panic close — clear everything"
            id="panic-close-btn"
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* ── No encryption key warning ────────────────────── */}
      {!hasKey && (
        <div className="mx-4 mt-2 flex items-center gap-2 rounded-lg bg-amber-500/10 border border-stone-400/20 px-3 py-2 text-xs text-stone-300 animate-slide-down">
          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
          No encryption key found. Ask your contact to share the secure link for E2E encryption.
        </div>
      )}

      {/* ── Messages Area ────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-1" id="chat-area">
        {/* Waiting state */}
        {userCount < 2 && messages.filter((m) => m.type !== 'system').length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in">
            <div className="animate-pulse-glow mb-4">
              <Shield className="h-16 w-16 text-amber-500/40" />
            </div>
            <p className="text-slate-400 font-medium">Waiting for other user…</p>
            <p className="text-xs text-slate-600 mt-1">Share the room link to get started</p>
          </div>
        )}

        {messages.map((msg) =>
          msg.type === 'system' ? (
            <div key={msg.id} className="flex justify-center py-2 animate-fade-in">
              <span className="rounded-full bg-surface-800/60 px-4 py-1.5 text-[11px] text-slate-500 font-medium">
                {msg.text}
              </span>
            </div>
          ) : (
            <MessageBubble
              key={msg.id}
              message={msg}
              showTimestamp={showTimestamps}
              onBurn={msg.burn ? () => burnMessage(msg.id) : undefined}
            />
          )
        )}

        {peerTyping && <TypingIndicator label={peerLabel} />}
        <div ref={bottomRef} />
      </main>

      {/* ── Input Bar ────────────────────────────────────── */}
      <footer className="glass-light sticky bottom-0 z-20 px-4 py-3">
        <div className="flex items-end gap-2">
          {/* Burn toggle */}
          <button
            onClick={() => setBurnMode(!burnMode)}
            className={`mb-1 rounded-lg p-2 transition-all duration-200 ${
              burnMode
                ? 'bg-orange-500/20 text-stone-200 ring-1 ring-orange-500/30'
                : 'text-slate-600 hover:text-slate-400 hover:bg-surface-800'
            }`}
            title="Burn after reading"
            id="burn-mode-btn"
          >
            <Flame className="h-5 w-5" />
          </button>

          {/* Textarea */}
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={burnMode ? '🔥 Burn after reading…' : 'Type a message…'}
              rows={1}
              className="input-field resize-none py-2.5 pr-12 text-sm leading-relaxed"
              style={{ maxHeight: '120px' }}
              id="message-input"
            />
          </div>

          {/* Send */}
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="mb-1 rounded-xl bg-stone-500 p-2.5 text-white transition-all duration-200 hover:bg-amber-500 disabled:opacity-30 disabled:hover:bg-stone-500"
            id="send-btn"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>

        {/* Timestamp toggle */}
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-600">
          <span className="flex items-center gap-1">
            <Lock className="h-2.5 w-2.5 text-amber-500/60" />
            {hasKey ? 'Messages are end-to-end encrypted' : 'Encryption unavailable'}
          </span>
          <button
            onClick={() => setShowTimestamps(!showTimestamps)}
            className="flex items-center gap-1 hover:text-slate-400 transition-colors"
            id="timestamp-toggle"
          >
            <Clock className="h-2.5 w-2.5" />
            {showTimestamps ? 'Hide' : 'Show'} times
          </button>
        </div>
      </footer>
    </div>
  );
}

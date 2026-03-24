<div align="center">
  <img src="https://raw.githubusercontent.com/lucide-icons/lucide/main/icons/lock.svg" width="80" alt="Lock logo" />
  <h1>NullRoom (Currently "Whisper")</h1>
  <p><strong>A beautifully aesthetic, zero-knowledge ephemeral chat application.</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#security-model">Security Model</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a>
  </p>
</div>

---

## 🔒 About

This project is an **end-to-end encrypted (E2EE), ephemeral chat app** designed with pure privacy and aesthetics in mind. No accounts are needed, no databases store your messages permanently, and the server acts with absolutely **zero-knowledge**. It merely brokers encrypted blobs between two participants. 

Your encryption keys are generated entirely in the browser and pass directly between peers via a secure URL hash (`#key=...`), meaning the server never even *sees* the key required to decrypt your conversation.

## ✨ Features

- **True E2E Encryption:** Messages are encrypted locally on your device via the `Web Crypto API` (AES-256-GCM).
- **Self-Destructing Rooms:** Choose your own TTL (Time-to-Live): 5 min, 15 min, 1 hr, or 24 hours. When the timer hits zero—or when both users disconnect—the room is permanently nuked from memory.
- **Zero-Knowledge Architecture:** Backend logging is disabled. The server relays raw `ArrayBuffers` of ciphertext without the capacity to read them.
- **Premium Dark UI:** Designed using Tailwind CSS with a stunning "mocha brown & beige" glassmorphic aesthetic. Includes animated glowing borders, particle backgrounds, and deep shadows.
- **Message Read Receipts:** Real-time dual-check indicators (✓✓) synced over WebSockets.
- **Typing Indicators:** Animated bubble when the peer is writing a message.
- **Burn After Reading:** Messages visually self-destruct with a blur/fade animation 10 seconds after they are read.
- **Privacy Blur:** Messages automatically blur out when you switch to another browser tab.

## 🛡️ Security Model

1. **Client-Side Key Generation**: When a user creates a room, a 256-bit AES-GCM key is generated securely via `crypto.subtle`.
2. **Key Distribution**: The key is dynamically exported and embedded into the URL *hash fragment* (`https://.../chat/X7K-29P#key=CrT...`). **Browsers never send hash fragments to the server**, ensuring absolute privacy.
3. **Payload Construction**: For every message sent, a novel 96-bit Initialization Vector (IV) is generated. The message is encrypted into a blind ArrayBuffer.
4. **Relay**: The Node.js / Socket.IO server only receives this buffer and relays it to anyone sitting in the corresponding Room ID socket.
5. **Decryption**: The recipient reads the key from their browser's local hash parameter and natively decrypts the blob back into plaintext to render onto the UI.

## 💻 Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS v3, Socket.IO Client, Web Crypto API
- **Backend:** Node.js, Express, Socket.IO, Redis (Optional, falls back to in-memory TTL maps for local dev)
- **Icons:** Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js `v18+`
- (Optional) Redis server for distributed TTL capability

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/reponame.git
   cd reponame
   ```

2. **Start the Backend**
   ```bash
   cd backend
   npm install
   # Create a .env if you wish to use Redis
   npm run dev
   ```
   *The backend will boot up on `http://localhost:3001`.*

3. **Start the Frontend**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```
   *The frontend will boot up on `http://localhost:5173`. Open this URL, click "Create Room," and share the secure link with a friend to test.*

## 📜 License
MIT License. Feel free to fork, learn from, and modify this project!

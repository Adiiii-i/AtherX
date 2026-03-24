import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ChatRoom from './pages/ChatRoom';
import NotFound from './pages/NotFound';
import Particles from './components/Particles';

export default function App() {
  return (
    <BrowserRouter>
      <Particles count={50} />
      <div className="grid-pattern" />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

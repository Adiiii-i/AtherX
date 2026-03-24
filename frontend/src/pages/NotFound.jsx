import { useNavigate } from 'react-router-dom';
import { Ghost, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4">
      <div className="relative z-10 text-center animate-scale-in">
        <Ghost className="mx-auto mb-6 h-20 w-20 text-slate-700 animate-float" />
        <h1 className="mb-2 text-3xl font-bold text-slate-200">Nothing here</h1>
        <p className="mb-8 text-sm text-slate-500 max-w-xs mx-auto">
          This room doesn't exist, has expired, or the link is invalid. Rooms vanish once everyone leaves.
        </p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary inline-flex items-center gap-2"
          id="not-found-home-btn"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
      </div>
    </div>
  );
}

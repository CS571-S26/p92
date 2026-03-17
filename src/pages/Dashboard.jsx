import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-900">
        <span className="text-xl font-bold tracking-tight">skinshi</span>
        <button
          className="px-4 py-2 rounded bg-zinc-900 text-white border border-zinc-800 hover:bg-zinc-800 transition-colors text-sm font-medium"
          onClick={() => navigate('/login')}
        >
          Login
        </button>
      </nav>
      <main className="flex flex-col items-center justify-center flex-1">
        <h1 className="text-5xl font-bold tracking-tight">skinshi.com</h1>
        <p className="mt-4 text-zinc-500 text-lg">💰</p>
      </main>
    </div>
  );
}


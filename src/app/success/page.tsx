'use client';

import { auth } from '@/lib/firebase';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [status, setStatus] = useState('Finalizing Steam link...');
  const hasRedirected = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function refreshToken() {
      try {
        const user = auth.currentUser;
        if (user) {
          await user.getIdToken(true);
          await user.getIdTokenResult(true);
        }
        if (mounted) {
          setStatus('Steam linked. Redirecting to settings...');
        }
      } catch {
        if (mounted) {
          setStatus('Steam linked. Redirecting to settings...');
        }
      }
    }

    refreshToken();

    const countdown = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(countdown);
    };
  }, []);

  // Handle navigation in a separate effect to avoid setState during render
  useEffect(() => {
    if (secondsLeft === 0 && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace('/settings');
    }
  }, [secondsLeft, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#141721] p-6 text-zinc-100">
        <h1 className="text-lg font-semibold">Steam Link Successful</h1>
        <p className="mt-3 text-sm text-zinc-300">{status}</p>
        <p className="mt-2 text-xs text-zinc-400">Redirecting in {secondsLeft}s...</p>
      </div>
    </div>
  );
}

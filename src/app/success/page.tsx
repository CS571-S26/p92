'use client';

import { auth } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(5);
  const [status, setStatus] = useState('Finalizing Steam link...');

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
          setStatus('Steam linked. Redirecting to profile...');
        }
      } catch {
        if (mounted) {
          setStatus('Steam linked. Redirecting to profile...');
        }
      }
    }

    refreshToken();

    const countdown = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdown);
          router.replace('/profile');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      mounted = false;
      clearInterval(countdown);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-white/10 bg-[#141721] p-6 text-zinc-100">
        <h1 className="text-lg font-semibold">Steam Link Successful</h1>
        <p className="mt-3 text-sm text-zinc-300">{status}</p>
        <p className="mt-2 text-xs text-zinc-500">Redirecting in {secondsLeft}s...</p>
      </div>
    </div>
  );
}

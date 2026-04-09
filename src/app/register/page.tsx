"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailError = useMemo(() => {
    if (!email) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? null : "Invalid email format";
  }, [email]);

  const passwordError = useMemo(() => {
    if (!password) return null;
    return password.length >= 6 ? null : "Password must be at least 6 characters";
  }, [password]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Email and password are required");
      return;
    }

    if (emailError || passwordError) {
      setError("Please fix the highlighted fields");
      return;
    }

    try {
      setSubmitting(true);
      await createUserWithEmailAndPassword(auth, email, password);
      router.push("/link-steam");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="bg-zinc-950 border border-zinc-900 p-8 rounded-lg w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-6">Register</h2>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-zinc-400 mb-1 text-sm" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black text-white border border-zinc-800 focus:outline-none focus:border-zinc-600 text-sm"
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>

          <div>
            <label className="block text-zinc-400 mb-1 text-sm" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-black text-white border border-zinc-800 focus:outline-none focus:border-zinc-600 text-sm"
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-white text-black py-2 rounded font-semibold hover:bg-zinc-200 transition-colors text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-zinc-500 text-sm">
          Already have an account?{" "}
          <button
            type="button"
            className="text-white underline hover:text-zinc-300 transition-colors"
            onClick={() => router.push("/login")}
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}

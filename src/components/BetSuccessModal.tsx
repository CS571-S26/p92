"use client";

import { useEffect, useState } from "react";
import type { OurMarket } from "@skinshi/auth-worker/schemas";

interface BetSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    bet_id: string;
    market_slug: string;
    market_id: string;
    outcome: string;
    trade_offer_id: string;
    trade_status: string;
    trade_expires_at: string;
    item_count: number;
  } | null;
  market: OurMarket;
  onTimerComplete: () => void;
}

export default function BetSuccessModal({
  isOpen,
  onClose,
  result,
  market,
  onTimerComplete,
}: BetSuccessModalProps) {
  const [countdown, setCountdown] = useState(10);
  const [tradeExpiryCountdown, setTradeExpiryCountdown] = useState("");

  // Auto-redirect countdown
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onTimerComplete]);

  // Trade expiry countdown
  useEffect(() => {
    if (!result?.trade_expires_at) return;

    const updateExpiry = () => {
      const expiry = new Date(result.trade_expires_at);
      const now = new Date();
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTradeExpiryCountdown("Expired");
        return;
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTradeExpiryCountdown(`${minutes}m ${seconds}s`);
    };

    updateExpiry();
    const timer = setInterval(updateExpiry, 1000);
    return () => clearInterval(timer);
  }, [result?.trade_expires_at]);

  if (!isOpen || !result) {
    return null;
  }

  const steamTradeUrl = `https://steamcommunity.com/tradeoffer/${result.trade_offer_id}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
      <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl max-w-lg w-full p-8 shadow-2xl shadow-emerald-500/10">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-500/10">
            <svg
              className="w-10 h-10 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Bet Placed Successfully!</h2>
          <p className="text-zinc-400">
            Your trade offer has been sent. Accept it in Steam to confirm your bet.
          </p>
        </div>

        {/* STEAM ACTION - PROMINENT */}
        <div className="bg-gradient-to-br from-[#1b2838] to-[#2a475e] rounded-xl p-6 mb-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39l3.03-6.24a3.5 3.5 0 01-1.74-4.57 3.5 3.5 0 014.57-1.74 3.5 3.5 0 011.74 4.57l3 6.18C23.3 20.1 24 16.14 24 12 24 5.37 18.63 0 12 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Accept Trade in Steam</h3>
              <p className="text-[#c6d4df] text-sm">Click below to open Steam and accept the trade offer</p>
            </div>
          </div>

          <a
            href={steamTradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 bg-[#66c0f4] hover:bg-[#8ed4f5] text-[#171a21] font-bold rounded-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 text-lg shadow-lg shadow-[#66c0f4]/20"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.39l3.03-6.24a3.5 3.5 0 01-1.74-4.57 3.5 3.5 0 014.57-1.74 3.5 3.5 0 011.74 4.57l3 6.18C23.3 20.1 24 16.14 24 12 24 5.37 18.63 0 12 0z" />
            </svg>
            Open Trade in Steam
          </a>

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-[#c6d4df]">Trade Offer #{result.trade_offer_id}</span>
            <button
              onClick={() => copyToClipboard(result.trade_offer_id)}
              className="text-[#66c0f4] hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy ID
            </button>
          </div>
        </div>

        {/* Market Info */}
        <div className="bg-zinc-900/50 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            {market.icon && (
              <img
                src={market.icon}
                alt=""
                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-medium text-sm truncate">{market.question}</h3>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span
                  className={
                    result.outcome === "yes" ? "text-emerald-400" : "text-rose-400"
                  }
                >
                  {result.outcome.toUpperCase()}
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">{result.item_count} cases</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expiration Warning */}
        <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-6">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-amber-400 text-sm font-medium">Expires in {tradeExpiryCountdown}</span>
          </div>
          <span className="text-zinc-500 text-xs">1 hour limit</span>
        </div>

        {/* Secondary Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onTimerComplete}
            className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            View Trade Status
          </button>
          <button
            onClick={onClose}
            className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            Continue Browsing
          </button>
        </div>

        {/* Auto-redirect notice */}
        <p className="text-zinc-600 text-xs text-center mt-4">
          Redirecting to trade page in {countdown} seconds...
        </p>
      </div>
    </div>
  );
}

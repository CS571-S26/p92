'use client';

import { useEffect, useState } from "react";

interface SuccessToastProps {
  email?: string | null;
  onDone: () => void;
  duration?: number;
  reason: "Registered" | "Sent Verification Code" | "Logged in" | "Logged out" | "Linked Steam Account";
  position?: "top-right" | "bottom-right";
}

export default function SuccessToast({ email, onDone, duration = 800, reason, position = "bottom-right" }: SuccessToastProps) {
  const [visible, setVisible] = useState(false);

  const isNeutral = reason === "Logged out";
  const accentColor = isNeutral ? "bg-gray-400" : "bg-green-500";
  const borderColor = isNeutral ? "border-gray-200" : "border-green-200";

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), 10);
    const hideTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDone, 400);
    }, duration);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const positionClass = position === "bottom-right" ? "bottom-5" : "top-5";
  const translateClass = visible
    ? "opacity-100 translate-y-0"
    : position === "bottom-right"
      ? "opacity-0 translate-y-2"
      : "opacity-0 -translate-y-2";

  return (
    <div
      className={`fixed right-5 z-50 flex items-start gap-3 bg-white border ${borderColor} shadow-lg rounded-xl px-4 py-3 max-w-sm transition-all duration-400 ${positionClass} ${translateClass}`}
    >
      <div className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full ${accentColor} flex items-center justify-center`}>
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">Successfully {reason}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{email}</p>
      </div>
    </div>
  );
}

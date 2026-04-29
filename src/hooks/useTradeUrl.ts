import { useState, useCallback } from 'react';
import { TRADE_URL_STORAGE_KEY } from '@/lib/constants';

function getInitialTradeUrl() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(TRADE_URL_STORAGE_KEY) ?? '';
}

export function useTradeUrl() {
  const [tradeUrl, setTradeUrlState] = useState(getInitialTradeUrl);
  const [savedTradeUrl, setSavedTradeUrl] = useState(getInitialTradeUrl);

  const setTradeUrl = useCallback((url: string) => {
    setTradeUrlState(url);
  }, []);

  const saveTradeUrl = useCallback((url: string) => {
    const normalized = url.trim();
    if (!normalized) return false;
    localStorage.setItem(TRADE_URL_STORAGE_KEY, normalized);
    setSavedTradeUrl(normalized);
    setTradeUrlState(normalized);
    return true;
  }, []);

  const dirty = tradeUrl.trim() !== savedTradeUrl.trim();

  return {
    tradeUrl,
    savedTradeUrl,
    dirty,
    setTradeUrl,
    saveTradeUrl,
  };
}

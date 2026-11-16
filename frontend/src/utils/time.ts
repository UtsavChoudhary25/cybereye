import { useState, useEffect } from 'react';

/**
 * Returns human-readable relative time (e.g., "Just now", "42s ago", "3m ago", "2h ago", "1d ago").
 */
export function formatLiveRelativeTime(dateInput: string | number | Date): string {
  if (!dateInput) return 'Unknown';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return 'Invalid date';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  // Future dates safeguard (due to slight server clock skew)
  if (diffMs < -1000) {
    return 'Just now';
  }

  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 20) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/**
 * Formats full UTC timestamp with seconds: "11 Sep 2026 14:13:28 UTC".
 */
export function formatExactUtcTime(dateInput: string | number | Date): string {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  const day = String(date.getUTCDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${day} ${month} ${year} ${hours}:${minutes}:${seconds} UTC`;
}

/**
 * Checks whether an event occurred within the threshold in seconds (default: 5 minutes).
 */
export function isRecentEvent(dateInput: string | number | Date, thresholdSeconds: number = 300): boolean {
  if (!dateInput) return false;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return false;
  const diffMs = Date.now() - date.getTime();
  return diffMs >= -2000 && diffMs <= thresholdSeconds * 1000;
}

/**
 * React hook that triggers a state update every `intervalMs` (default 5000ms),
 * causing components consuming relative time to automatically advance without full reload.
 */
export function useLiveTimer(intervalMs: number = 5000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => (t + 1) % 1000000);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return tick;
}

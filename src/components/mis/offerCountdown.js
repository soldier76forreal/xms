import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';

// Time left on a website price offer, ticking once a second.
//
// It is measured against the SERVER's clock: the API sends `serverNow` with every
// offer, so the difference between the server and this device is applied. A
// customer's or an associate's own clock is often minutes off, and an offer that
// runs for two hours must not appear to expire early or late because of that.

export function useRemainingMs(validUntil, serverNow) {
  const [, setTick] = useState(0);
  // how far this device is ahead of / behind the server, fixed when the data arrived
  const skew = useMemo(
    () => (serverNow ? new Date(serverNow).getTime() - Date.now() : 0),
    [serverNow] // eslint-disable-line react-hooks/exhaustive-deps
  );
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);
  if (!validUntil) return null;
  return new Date(validUntil).getTime() - (Date.now() + skew);
}

// 01:42:09 — with a "2d" prefix when it is more than a day away.
export function formatRemaining(ms) {
  if (ms == null) return '';
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${days ? `${days}d ` : ''}${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// The countdown itself. Turns amber in the last half hour. `onExpire` fires once
// when it reaches zero, so a screen can refetch and show the offer as expired.
export default function OfferCountdown({ validUntil, serverNow, onExpire, sx }) {
  const remaining = useRemainingMs(validUntil, serverNow);
  const fired = useRef(false);
  const over = remaining != null && remaining <= 0;

  useEffect(() => { fired.current = false; }, [validUntil]);
  useEffect(() => {
    if (over && !fired.current) {
      fired.current = true;
      if (onExpire) onExpire();
    }
  }, [over, onExpire]);

  if (remaining == null) return null;
  const urgent = remaining <= 30 * 60 * 1000;
  return (
    <Box component="span" sx={{
      fontFamily: 'monospace', fontWeight: 700, fontVariantNumeric: 'tabular-nums', direction: 'ltr',
      color: over ? 'error.main' : (urgent ? 'warning.main' : 'inherit'), ...sx,
    }}>
      {formatRemaining(remaining)}
    </Box>
  );
}

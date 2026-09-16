"use client";
import { useEffect } from "react";

/**
 * Tells the server which time zone this phone is in, so "today" means the lifter's today. Written quietly with no
 * refresh: it only changes anything in the hour around midnight, and the next page view picks it up.
 */
export function TimeZoneCookie() {
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const current = document.cookie.match(/(?:^|; )kw-tz=([^;]*)/)?.[1];
      if (tz && decodeURIComponent(current ?? "") !== tz) document.cookie = `kw-tz=${encodeURIComponent(tz)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    } catch {}
  }, []);
  return null;
}

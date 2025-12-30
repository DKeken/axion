"use client";

import { UserButton } from "@axion/better-auth/ui";
import { useEffect, useState } from "react";

export function UserMenu() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Avoid synchronous setState in effect to prevent cascading renders
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />;
  }

  return <UserButton />;
}

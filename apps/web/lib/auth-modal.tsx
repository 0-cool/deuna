"use client";

import { createContext, useContext, useMemo, useState } from "react";

export type AuthModalView = "login" | "register";

interface AuthModalContextValue {
  open: boolean;
  view: AuthModalView;
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
}

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<AuthModalView>("login");

  const value = useMemo<AuthModalContextValue>(
    () => ({
      open,
      view,
      openLogin: () => {
        setView("login");
        setOpen(true);
      },
      openRegister: () => {
        setView("register");
        setOpen(true);
      },
      close: () => setOpen(false),
    }),
    [open, view],
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal(): AuthModalContextValue {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal debe usarse dentro de <AuthModalProvider>");
  return ctx;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AgeStatus = "unknown" | "verified" | "blocked";

const STORAGE_KEY = "deuna_age_verified_v1";

interface AgeVerificationContextValue {
  status: AgeStatus;
  ready: boolean;
  modalOpen: boolean;
  requestVerification: () => void;
  closeModal: () => void;
  markVerified: () => void;
  markBlocked: () => void;
  canViewRestrictedMedia: boolean;
}

const AgeVerificationContext = createContext<AgeVerificationContextValue | null>(null);

export function AgeVerificationProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AgeStatus>("unknown");
  const [ready, setReady] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setStatus("verified");
    else if (stored === "blocked") setStatus("blocked");
    else setStatus("unknown");
    setReady(true);
  }, []);

  const value = useMemo<AgeVerificationContextValue>(
    () => ({
      status,
      ready,
      modalOpen,
      requestVerification: () => setModalOpen(true),
      closeModal: () => setModalOpen(false),
      markVerified: () => {
        window.localStorage.setItem(STORAGE_KEY, "true");
        setStatus("verified");
        setModalOpen(false);
      },
      markBlocked: () => {
        window.localStorage.setItem(STORAGE_KEY, "blocked");
        setStatus("blocked");
      },
      canViewRestrictedMedia: status === "verified",
    }),
    [status, ready, modalOpen],
  );

  return (
    <AgeVerificationContext.Provider value={value}>{children}</AgeVerificationContext.Provider>
  );
}

export function useAgeVerification(): AgeVerificationContextValue {
  const ctx = useContext(AgeVerificationContext);
  if (!ctx) {
    throw new Error("useAgeVerification debe usarse dentro de <AgeVerificationProvider>");
  }
  return ctx;
}

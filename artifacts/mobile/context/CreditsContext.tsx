import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePlan } from "./PlanContext";

const CREDITS_KEY = "@jade_ia:wa_credits_v1";

interface CreditsData {
  used: number;
  month: string;
  extra: number;
}

const PLAN_LIMITS: Record<string, number> = {
  start: 300,
  pro: 1000,
  enterprise: 5000,
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface CreditsContextType {
  planLimit: number;
  total: number;
  used: number;
  remaining: number;
  extra: number;
  warnLevel: "ok" | "warn" | "empty";
  useCredit: () => void;
  addExtra: (amount: number) => Promise<void>;
}

const CreditsContext = createContext<CreditsContextType | null>(null);

export function useCredits() {
  const ctx = useContext(CreditsContext);
  if (!ctx) throw new Error("useCredits must be inside CreditsProvider");
  return ctx;
}

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const { userPlan } = usePlan();
  const [data, setData] = useState<CreditsData>({ used: 0, month: currentMonth(), extra: 0 });

  const planLimit = PLAN_LIMITS[userPlan] ?? 300;
  const total = planLimit + data.extra;
  const remaining = Math.max(0, total - data.used);
  const warnLevel: "ok" | "warn" | "empty" =
    remaining === 0 ? "empty" : remaining < total * 0.2 ? "warn" : "ok";

  useEffect(() => {
    AsyncStorage.getItem(CREDITS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as CreditsData;
        const m = currentMonth();
        if (parsed.month !== m) {
          const reset: CreditsData = { used: 0, month: m, extra: parsed.extra ?? 0 };
          setData(reset);
          AsyncStorage.setItem(CREDITS_KEY, JSON.stringify(reset));
        } else {
          setData(parsed);
        }
      } catch { /* ignore */ }
    });
  }, []);

  const useCredit = useCallback(() => {
    setData((prev) => {
      const updated = { ...prev, used: prev.used + 1 };
      AsyncStorage.setItem(CREDITS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addExtra = useCallback(async (amount: number) => {
    setData((prev) => {
      const updated = { ...prev, extra: prev.extra + amount };
      AsyncStorage.setItem(CREDITS_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <CreditsContext.Provider value={{ planLimit, total, used: data.used, remaining, extra: data.extra, warnLevel, useCredit, addExtra }}>
      {children}
    </CreditsContext.Provider>
  );
}

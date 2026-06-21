import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Plan = "start" | "pro" | "enterprise";

const DEMO_KEY = "@jade_demo_state";

interface DemoState {
  used: boolean;
  feature: string | null;
  expiry: number | null; // timestamp ms
}

interface PlanContextValue {
  userPlan: Plan;
  setUserPlan: (plan: Plan) => void;
  isDevMode: boolean;
  setDevMode: (v: boolean) => void;
  isPro: boolean;
  isEnterprise: boolean;
  canAccess: (required: "pro" | "enterprise") => boolean;
  // Demo gratuita (Start plan)
  demo: DemoState;
  hasDemoAvailable: boolean;
  isDemoActiveFor: (feature: string) => boolean;
  useDemo: (feature: string) => Promise<void>;
  clearDemo: () => Promise<void>;
}

const defaultDemo: DemoState = { used: false, feature: null, expiry: null };

const PlanContext = createContext<PlanContextValue>({
  userPlan: "pro",
  setUserPlan: () => {},
  isDevMode: false,
  setDevMode: () => {},
  isPro: true,
  isEnterprise: false,
  canAccess: () => true,
  demo: defaultDemo,
  hasDemoAvailable: false,
  isDemoActiveFor: () => false,
  useDemo: async () => {},
  clearDemo: async () => {},
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [userPlan, setUserPlan] = useState<Plan>("pro");
  const [isDevMode, setDevMode] = useState(false);
  const [demo, setDemo] = useState<DemoState>(defaultDemo);

  // Load demo state on mount
  useEffect(() => {
    AsyncStorage.getItem(DEMO_KEY).then((raw) => {
      if (raw) {
        try {
          const saved = JSON.parse(raw) as DemoState;
          // Check if demo expired
          if (saved.used && saved.expiry && Date.now() > saved.expiry) {
            setDemo(defaultDemo);
            AsyncStorage.removeItem(DEMO_KEY).catch(() => {});
          } else {
            setDemo(saved);
          }
        } catch { /* ignore */ }
      }
    });
  }, []);

  const isPro        = userPlan === "pro" || userPlan === "enterprise";
  const isEnterprise = userPlan === "enterprise";

  const canAccess = (required: "pro" | "enterprise"): boolean => {
    if (required === "pro")        return isPro;
    if (required === "enterprise") return isEnterprise;
    return true;
  };

  // Demo is available if: plan=start, not yet used
  const hasDemoAvailable = userPlan === "start" && !demo.used;

  // Demo is active for a specific feature if used + not expired + same feature
  const isDemoActiveFor = (feature: string): boolean => {
    if (!demo.used || !demo.feature || !demo.expiry) return false;
    if (Date.now() > demo.expiry) return false;
    return demo.feature === feature;
  };

  const useDemo = async (feature: string) => {
    const expiry = Date.now() + 24 * 60 * 60 * 1000; // 24h
    const next: DemoState = { used: true, feature, expiry };
    setDemo(next);
    try { await AsyncStorage.setItem(DEMO_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const clearDemo = async () => {
    setDemo(defaultDemo);
    try { await AsyncStorage.removeItem(DEMO_KEY); } catch { /* ignore */ }
  };

  return (
    <PlanContext.Provider value={{
      userPlan, setUserPlan, isDevMode, setDevMode, isPro, isEnterprise, canAccess,
      demo, hasDemoAvailable, isDemoActiveFor, useDemo, clearDemo,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}

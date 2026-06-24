import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Plan = "start" | "pro" | "enterprise";

const PLAN_KEY  = "@jade_dev_plan";
const DEMO_KEY  = "@jade_demo_state";

interface DemoState {
  used: boolean;
  feature: string | null;
  expiry: number | null;
}

interface PlanContextValue {
  userPlan: Plan;
  setUserPlan: (plan: Plan) => void;
  planLoaded: boolean;
  isDevMode: boolean;
  setDevMode: (v: boolean) => void;
  isPro: boolean;
  isEnterprise: boolean;
  canAccess: (required: "pro" | "enterprise") => boolean;
  demo: DemoState;
  hasDemoAvailable: boolean;
  isDemoActiveFor: (feature: string) => boolean;
  useDemo: (feature: string) => Promise<void>;
  clearDemo: () => Promise<void>;
}

const defaultDemo: DemoState = { used: false, feature: null, expiry: null };

const PlanContext = createContext<PlanContextValue>({
  userPlan: "start",
  setUserPlan: () => {},
  planLoaded: false,
  isDevMode: false,
  setDevMode: () => {},
  isPro: false,
  isEnterprise: false,
  canAccess: () => false,
  demo: defaultDemo,
  hasDemoAvailable: false,
  isDemoActiveFor: () => false,
  useDemo: async () => {},
  clearDemo: async () => {},
});

const VALID_PLANS: Plan[] = ["start", "pro", "enterprise"];

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [userPlan,   setUserPlanState] = useState<Plan>("start");
  const [planLoaded, setPlanLoaded]    = useState(false);
  const [isDevMode,  setDevMode]       = useState(false);
  const [demo,       setDemo]          = useState<DemoState>(defaultDemo);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(PLAN_KEY),
      AsyncStorage.getItem(DEMO_KEY),
    ]).then(([planRaw, demoRaw]) => {
      if (planRaw && VALID_PLANS.includes(planRaw as Plan)) {
        setUserPlanState(planRaw as Plan);
      }
      if (demoRaw) {
        try {
          const saved = JSON.parse(demoRaw) as DemoState;
          if (saved.used && saved.expiry && Date.now() > saved.expiry) {
            AsyncStorage.removeItem(DEMO_KEY).catch(() => {});
          } else {
            setDemo(saved);
          }
        } catch { /* ignore */ }
      }
      setPlanLoaded(true);
    }).catch(() => {
      setPlanLoaded(true);
    });
  }, []);

  const setUserPlan = useCallback((plan: Plan) => {
    setUserPlanState(plan);
    AsyncStorage.setItem(PLAN_KEY, plan).catch(() => {});
  }, []);

  const isPro        = userPlan === "pro" || userPlan === "enterprise";
  const isEnterprise = userPlan === "enterprise";

  const canAccess = (required: "pro" | "enterprise"): boolean => {
    if (required === "pro")        return isPro;
    if (required === "enterprise") return isEnterprise;
    return true;
  };

  const hasDemoAvailable = userPlan === "start" && !demo.used;

  const isDemoActiveFor = (feature: string): boolean => {
    if (!demo.used || !demo.feature || !demo.expiry) return false;
    if (Date.now() > demo.expiry) return false;
    return demo.feature === feature;
  };

  const useDemo = async (feature: string) => {
    const expiry = Date.now() + 24 * 60 * 60 * 1000;
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
      userPlan, setUserPlan, planLoaded,
      isDevMode, setDevMode,
      isPro, isEnterprise, canAccess,
      demo, hasDemoAvailable, isDemoActiveFor, useDemo, clearDemo,
    }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}

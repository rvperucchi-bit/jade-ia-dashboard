import React, { createContext, useContext, useState } from "react";

export type Plan = "start" | "pro" | "enterprise";

interface PlanContextValue {
  userPlan: Plan;
  setUserPlan: (plan: Plan) => void;
  isDevMode: boolean;
  setDevMode: (v: boolean) => void;
  isPro: boolean;
  isEnterprise: boolean;
  canAccess: (required: "pro" | "enterprise") => boolean;
}

const PlanContext = createContext<PlanContextValue>({
  userPlan: "pro",
  setUserPlan: () => {},
  isDevMode: false,
  setDevMode: () => {},
  isPro: true,
  isEnterprise: false,
  canAccess: () => true,
});

export function PlanProvider({ children }: { children: React.ReactNode }) {
  const [userPlan, setUserPlan] = useState<Plan>("pro");
  const [isDevMode, setDevMode] = useState(false);

  const isPro       = userPlan === "pro" || userPlan === "enterprise";
  const isEnterprise = userPlan === "enterprise";

  const canAccess = (required: "pro" | "enterprise") => {
    if (required === "pro")        return isPro;
    if (required === "enterprise") return isEnterprise;
    return true;
  };

  return (
    <PlanContext.Provider value={{ userPlan, setUserPlan, isDevMode, setDevMode, isPro, isEnterprise, canAccess }}>
      {children}
    </PlanContext.Provider>
  );
}

export function usePlan() {
  return useContext(PlanContext);
}

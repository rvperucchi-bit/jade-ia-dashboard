import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@jade_ia:onboarding_v1";

export interface OnboardingData {
  companyName: string;
  userName: string;
  city: string;
  siteOrInsta: string;
  segment: string;
  firstModule: string;
}

interface OnboardingContextType {
  onboardingDone: boolean;
  onboardingLoaded: boolean;
  segment: string;
  companyName: string;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [onboardingDone,   setOnboardingDone]   = useState(false);
  const [onboardingLoaded, setOnboardingLoaded] = useState(false);
  const [segment,          setSegment]          = useState("");
  const [companyName,      setCompanyName]      = useState("");

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          const d = JSON.parse(raw) as OnboardingData & { done?: boolean };
          if (d.done) {
            setOnboardingDone(true);
            setSegment(d.segment ?? "");
            setCompanyName(d.companyName ?? "");
          }
        } catch { /* ignore */ }
      }
      setOnboardingLoaded(true);
    });
  }, []);

  const completeOnboarding = async (data: OnboardingData) => {
    await AsyncStorage.setItem(KEY, JSON.stringify({ done: true, ...data }));
    setOnboardingDone(true);
    setSegment(data.segment);
    setCompanyName(data.companyName);
  };

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem(KEY);
    setOnboardingDone(false);
    setSegment("");
    setCompanyName("");
  };

  return (
    <OnboardingContext.Provider value={{
      onboardingDone, onboardingLoaded, segment, companyName,
      completeOnboarding, resetOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be inside OnboardingProvider");
  return ctx;
}

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePlan } from "@/context/PlanContext";

const RADAR_KEY = "@jade_ia:radar_searches_v1";

const PLAN_SEARCH_LIMITS: Record<string, number> = {
  start: 5,
  pro: 30,
  enterprise: 100,
};

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

interface RadarSearchData {
  used: number;
  month: string;
  extra: number;
}

export function useRadarSearches() {
  const { userPlan } = usePlan();
  const [data, setData] = useState<RadarSearchData>({ used: 0, month: currentMonth(), extra: 0 });

  const planLimit = PLAN_SEARCH_LIMITS[userPlan] ?? 5;
  const total = planLimit + data.extra;
  const remaining = Math.max(0, total - data.used);
  const canSearch = remaining > 0;

  useEffect(() => {
    AsyncStorage.getItem(RADAR_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw) as RadarSearchData;
        const m = currentMonth();
        if (parsed.month !== m) {
          const reset: RadarSearchData = { used: 0, month: m, extra: parsed.extra ?? 0 };
          setData(reset);
          AsyncStorage.setItem(RADAR_KEY, JSON.stringify(reset));
        } else {
          setData(parsed);
        }
      } catch { /* ignore */ }
    });
  }, []);

  const decrement = useCallback(() => {
    setData((prev) => {
      const updated = { ...prev, used: prev.used + 1 };
      AsyncStorage.setItem(RADAR_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const addExtra = useCallback(async (amount: number) => {
    setData((prev) => {
      const updated = { ...prev, extra: prev.extra + amount };
      AsyncStorage.setItem(RADAR_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return { planLimit, total, used: data.used, remaining, canSearch, decrement, addExtra };
}

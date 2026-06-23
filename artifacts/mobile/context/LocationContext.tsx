import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STATE_MAP: Record<string, string> = {
  "Acre": "AC", "Alagoas": "AL", "Amapá": "AP", "Amazonas": "AM",
  "Bahia": "BA", "Ceará": "CE", "Distrito Federal": "DF",
  "Espírito Santo": "ES", "Goiás": "GO", "Maranhão": "MA",
  "Mato Grosso": "MT", "Mato Grosso do Sul": "MS", "Minas Gerais": "MG",
  "Pará": "PA", "Paraíba": "PB", "Paraná": "PR", "Pernambuco": "PE",
  "Piauí": "PI", "Rio de Janeiro": "RJ", "Rio Grande do Norte": "RN",
  "Rio Grande do Sul": "RS", "Rondônia": "RO", "Roraima": "RR",
  "Santa Catarina": "SC", "São Paulo": "SP", "Sergipe": "SE", "Tocantins": "TO",
};

type LocationState = {
  coords: { lat: number; lng: number } | null;
  city: string;
  state: string;
  permissionGranted: boolean;
  requested: boolean;
};

const LocationContext = createContext<LocationState>({
  coords: null, city: "", state: "", permissionGranted: false, requested: false,
});

const CACHE_KEY = "@jade:location_v1";

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [loc, setLoc] = useState<LocationState>({
    coords: null, city: "", state: "", permissionGranted: false, requested: false,
  });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as LocationState;
          setLoc({ ...parsed, requested: true });
        }
      } catch {}

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLoc(s => ({ ...s, permissionGranted: false, requested: true }));
        return;
      }

      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = pos.coords;
        const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
        const first = geo[0];
        const city  = first?.city ?? first?.subregion ?? "";
        const stateAbbr = STATE_MAP[first?.region ?? ""] ?? (first?.region ?? "").slice(0, 2).toUpperCase();

        const next: LocationState = {
          coords: { lat: latitude, lng: longitude },
          city, state: stateAbbr, permissionGranted: true, requested: true,
        };
        setLoc(next);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(next));
      } catch {
        setLoc(s => ({ ...s, permissionGranted: true, requested: true }));
      }
    })();
  }, []);

  return <LocationContext.Provider value={loc}>{children}</LocationContext.Provider>;
}

export const useLocation = () => useContext(LocationContext);

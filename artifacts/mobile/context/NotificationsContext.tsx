import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const STORAGE_KEY = "@jade_ia:notifications";
const MAX_NOTIFICATIONS = 100;

export interface AppNotification {
  id: string;
  type: "lead" | "jade" | "plano" | "relatorio";
  title: string;
  body: string;
  time: string;
  unread: boolean;
  createdAt: number;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  scheduleNotification: (title: string, body: string, type?: AppNotification["type"]) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  notifications: [],
  unreadCount: 0,
  scheduleNotification: async () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
});

function formatNotifTime(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return "Agora";
  if (diff < 3600000) return `Há ${Math.floor(diff / 60000)} min`;
  const d = new Date(ts);
  const today = new Date();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  if (d.toDateString() === today.toDateString()) return `Hoje, ${hh}:${mm}`;
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Ontem, ${hh}:${mm}`;
  return `${d.getDate()}/${d.getMonth() + 1}, ${hh}:${mm}`;
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    if (Platform.OS !== "web") {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });
      Notifications.requestPermissionsAsync().catch(() => {});
    }

    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setNotifications(JSON.parse(raw) as AppNotification[]);
        } catch {}
      }
    });
  }, []);

  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    type: AppNotification["type"] = "jade"
  ) => {
    const now = Date.now();
    const newNotif: AppNotification = {
      id: now.toString(),
      type,
      title,
      body,
      time: formatNotifTime(now),
      unread: true,
      createdAt: now,
    };

    setNotifications((prev) => {
      const updated = [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });

    if (Platform.OS !== "web") {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === "granted") {
          await Notifications.scheduleNotificationAsync({
            content: { title, body, sound: true },
            trigger: null,
          });
        }
      } catch {}
    }
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, unread: false } : n));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, unread: false }));
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <NotificationsContext.Provider value={{ notifications, unreadCount, scheduleNotification, markAsRead, markAllAsRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}

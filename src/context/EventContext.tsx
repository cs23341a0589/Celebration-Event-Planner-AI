import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { EventItem, NotificationItem } from "../types/index.ts";
import { api } from "../services/api.ts";
import { useAuth } from "./AuthContext.tsx";

interface EventContextType {
  events: EventItem[];
  activeEvent: EventItem | null;
  loadingEvents: boolean;
  notifications: NotificationItem[];
  unreadNotifCount: number;
  setActiveEventId: (id: string) => void;
  refreshEvents: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  markNotificationsAsRead: () => Promise<void>;
  createEvent: (data: Partial<EventItem>) => Promise<EventItem>;
  updateEvent: (id: string, updates: Partial<EventItem>) => Promise<EventItem>;
  deleteEvent: (id: string) => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const EventProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeEvent, setActiveEvent] = useState<EventItem | null>(null);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const refreshEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const res = await api.getEvents();
      if (res && res.events) {
        setEvents(res.events);
        if (res.events.length > 0) {
          setActiveEvent((curr) => {
            if (curr && res.events.some((e) => e.id === curr.id)) {
              return res.events.find((e) => e.id === curr.id) || res.events[0];
            }
            return res.events[0];
          });
        }
      }
    } catch (err) {
      console.error("Failed to load events", err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const res = await api.getNotifications();
      if (res && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  }, []);

  useEffect(() => {
    refreshEvents();
    refreshNotifications();
  }, [refreshEvents, refreshNotifications]);

  const setActiveEventId = (id: string) => {
    const found = events.find((e) => e.id === id);
    if (found) {
      setActiveEvent(found);
    }
  };

  const markNotificationsAsRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error("Error marking notifications read", e);
    }
  };

  const createEvent = async (data: Partial<EventItem>): Promise<EventItem> => {
    const res = await api.createEvent(data);
    await refreshEvents();
    await refreshNotifications();
    setActiveEvent(res.event);
    return res.event;
  };

  const updateEvent = async (id: string, updates: Partial<EventItem>): Promise<EventItem> => {
    const res = await api.updateEvent(id, updates);
    await refreshEvents();
    return res.event;
  };

  const deleteEvent = async (id: string): Promise<void> => {
    await api.deleteEvent(id);
    await refreshEvents();
  };

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  return (
    <EventContext.Provider
      value={{
        events,
        activeEvent,
        loadingEvents,
        notifications,
        unreadNotifCount,
        setActiveEventId,
        refreshEvents,
        refreshNotifications,
        markNotificationsAsRead,
        createEvent,
        updateEvent,
        deleteEvent,
      }}
    >
      {children}
    </EventContext.Provider>
  );
};

export function useEvent() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error("useEvent must be used within an EventProvider");
  }
  return context;
}

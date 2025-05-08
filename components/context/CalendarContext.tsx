"use client"

import { useLocalStorage } from "@/hooks/useLocalStorage"
import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

export interface CalendarCategory {
  id: string
  name: string
  color: string
  keywords?: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  startDate: Date
  endDate: Date
  isAllDay: boolean
  recurrence: "none" | "daily" | "weekly" | "monthly" | "yearly"
  location?: string
  participants: string[]
  notification: number
  description?: string
  color: string
  calendarId: string
}

interface CalendarContextType {
  calendars: CalendarCategory[]
  setCalendars: (calendars: CalendarCategory[]) => void
  events: CalendarEvent[]
  setEvents: (events: CalendarEvent[]) => void
  addCategory: (category: CalendarCategory) => void
  removeCategory: (id: string) => void
  updateCategory: (id: string, category: Partial<CalendarCategory>) => void
  addEvent: (newEvent: CalendarEvent) => void
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

// Default calendar categories
const defaultCalendars: CalendarCategory[] = [
  {
    id: "work",
    name: "Work",
    color: "bg-blue-500",
    keywords: [],
  },
  {
    id: "personal",
    name: "Personal",
    color: "bg-green-500",
    keywords: [],
  },
]

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false)
  const [calendars, setCalendars] = useLocalStorage<CalendarCategory[]>("calendar-categories", defaultCalendars)
  const [events, setEvents] = useLocalStorage<CalendarEvent[]>("calendar-events", [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  const addCategory = (category: CalendarCategory) => {
    setCalendars([...calendars, category])
  }

  const removeCategory = (id: string) => {
    setCalendars(calendars.filter((cal: CalendarCategory) => cal.id !== id))
  }

  const updateCategory = (id: string, category: Partial<CalendarCategory>) => {
    setCalendars(calendars.map((cal: CalendarCategory) => (cal.id === id ? { ...cal, ...category } : cal)))
  }

  const addEvent = (newEvent: CalendarEvent) => {
    setEvents((prevEvents: CalendarEvent[]) => {
      // Check if event already exists
      const eventExists = prevEvents.some((event: CalendarEvent) => event.id === newEvent.id)

      // If exists, replace it; otherwise add new event
      if (eventExists) {
        return prevEvents.map((event: CalendarEvent) => (event.id === newEvent.id ? newEvent : event))
      } else {
        return [...prevEvents, newEvent]
      }
    })
  }

  return (
    <CalendarContext.Provider
      value={{
        calendars,
        setCalendars,
        events,
        setEvents,
        addCategory,
        removeCategory,
        updateCategory,
        addEvent,
      }}
    >
      {children}
    </CalendarContext.Provider>
  )
}

export function useCalendar() {
  const context = useContext(CalendarContext)
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider")
  }
  return context
}

export const useCalendarContext = useCalendar

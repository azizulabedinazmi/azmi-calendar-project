export interface TimeCategory {
  id: string
  name: string
  color: string
  keywords: string[]
}

export interface TimeAnalytics {
  totalEvents: number
  totalHours: number
  categorizedHours: Record<string, number>
  mostProductiveDay: string
  mostProductiveHour: number
  longestEvent: {
    title: string
    duration: number
  }
}

export const defaultTimeCategories: TimeCategory[] = [
  {
    id: "work",
    name: "Work",
    color: "bg-blue-500",
    keywords: ["meeting", "work", "project", "discussion"],
  },
  {
    id: "personal",
    name: "Personal",
    color: "bg-green-500",
    keywords: ["gym", "workout", "rest", "entertainment", "personal"],
  },
  {
    id: "learning",
    name: "Learning",
    color: "bg-purple-500",
    keywords: ["study", "course", "training", "workshop"],
  },
  {
    id: "social",
    name: "Social",
    color: "bg-yellow-500",
    keywords: ["party", "date", "friends", "family", "gathering"],
  },
  {
    id: "health",
    name: "Health",
    color: "bg-red-500",
    keywords: ["doctor", "hospital", "checkup", "health", "medical"],
  },
]

export function analyzeTimeUsage(events: any[], categories: TimeCategory[] = defaultTimeCategories): TimeAnalytics {
  // Initialize results
  const result: TimeAnalytics = {
    totalEvents: events.length,
    totalHours: 0,
    categorizedHours: {},
    mostProductiveDay: "",
    mostProductiveHour: 0,
    longestEvent: {
      title: "",
      duration: 0,
    },
  }

  // Initialize category time
  categories.forEach((category) => {
    result.categorizedHours[category.id] = 0
  })
  result.categorizedHours["uncategorized"] = 0

  // Count events by day and hour
  const eventsByDay: Record<string, number> = {}
  const eventsByHour: Record<number, number> = {}
  for (let i = 0; i < 24; i++) {
    eventsByHour[i] = 0
  }

  // Analyze each event
  events.forEach((event) => {
    const startDate = new Date(event.startDate)
    const endDate = new Date(event.endDate)
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)

    // Update total time
    result.totalHours += durationHours

    // Update longest event
    if (durationHours > result.longestEvent.duration) {
      result.longestEvent = {
        title: event.title,
        duration: durationHours,
      }
    }

    // Count by day
    const dayKey = startDate.toISOString().split("T")[0]
    eventsByDay[dayKey] = (eventsByDay[dayKey] || 0) + durationHours

    // Count by hour
    const hour = startDate.getHours()
    eventsByHour[hour] = (eventsByHour[hour] || 0) + 1

    // First check if event has calendarId, if yes, use that category directly
    if (event.calendarId && categories.some((cat) => cat.id === event.calendarId)) {
      result.categorizedHours[event.calendarId] += durationHours
      return // Already categorized, skip keyword matching
    }

    // If no calendarId or calendarId not in category list, try keyword matching
    let categorized = false
    for (const category of categories) {
      const matchesKeyword = category.keywords.some(
        (keyword) =>
          event.title.toLowerCase().includes(keyword.toLowerCase()) ||
          (event.description && event.description.toLowerCase().includes(keyword.toLowerCase())),
      )

      if (matchesKeyword) {
        result.categorizedHours[category.id] += durationHours
        categorized = true
        break
      }
    }

    if (!categorized) {
      result.categorizedHours["uncategorized"] += durationHours
    }
  })

  // Find most productive day
  let maxHours = 0
  for (const [day, hours] of Object.entries(eventsByDay)) {
    if (hours > maxHours) {
      maxHours = hours
      result.mostProductiveDay = day
    }
  }

  // Find most productive hour
  let maxEvents = 0
  for (const [hour, count] of Object.entries(eventsByHour)) {
    if (count > maxEvents) {
      maxEvents = count
      result.mostProductiveHour = Number.parseInt(hour)
    }
  }

  return result
}

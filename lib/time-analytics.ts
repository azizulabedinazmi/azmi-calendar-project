export interface TimeCategory {
  id: string;
  name: string;
  color: string;
  keywords: string[];
}

export interface TimeAnalytics {
  totalEvents: number;
  totalHours: number;
  categorizedHours: Record<string, number>;
  mostProductiveDay: string;
  mostProductiveHour: number;
  longestEvent: {
    title: string;
    duration: number;
  };
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
    keywords: ["personal", "gym", "workout", "rest", "entertainment"],
  },
  {
    id: "learning",
    name: "Learning",
    color: "bg-purple-500",
    keywords: ["study", "course", "training", "seminar"],
  },
  {
    id: "social",
    name: "Social",
    color: "bg-yellow-500",
    keywords: ["party", "date", "friends", "family"],
  },
  {
    id: "health",
    name: "Health",
    color: "bg-red-500",
    keywords: ["doctor", "hospital", "checkup", "health"],
  },
];

export function analyzeTimeUsage(events: any[], categories: TimeCategory[] = defaultTimeCategories): TimeAnalytics {
  // Initialize the result
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
  };

  // Initialize categorized hours
  categories.forEach((category) => {
    result.categorizedHours[category.id] = 0;
  });
  result.categorizedHours["uncategorized"] = 0;

  // Track events by day and hour
  const eventsByDay: Record<string, number> = {};
  const eventsByHour: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    eventsByHour[i] = 0;
  }

  // Analyze each event
  events.forEach((event) => {
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    // Update total hours
    result.totalHours += durationHours;

    // Update the longest event
    if (durationHours > result.longestEvent.duration) {
      result.longestEvent = {
        title: event.title,
        duration: durationHours,
      };
    }

    // Track hours by day
    const dayKey = startDate.toISOString().split("T")[0];
    eventsByDay[dayKey] = (eventsByDay[dayKey] || 0) + durationHours;

    // Track events by hour
    const hour = startDate.getHours();
    eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;

    // Check if the event has a calendarId and use it for categorization
    if (event.calendarId && categories.some((cat) => cat.id === event.calendarId)) {
      result.categorizedHours[event.calendarId] += durationHours;
      return; // Skip keyword matching if already categorized
    }

    // If no calendarId or it doesn't match, try keyword matching
    let categorized = false;
    for (const category of categories) {
      const matchesKeyword = category.keywords.some(
        (keyword) =>
          event.title.toLowerCase().includes(keyword.toLowerCase()) ||
          (event.description && event.description.toLowerCase().includes(keyword.toLowerCase()))
      );

      if (matchesKeyword) {
        result.categorizedHours[category.id] += durationHours;
        categorized = true;
        break;
      }
    }

    if (!categorized) {
      result.categorizedHours["uncategorized"] += durationHours;
    }
  });

  // Find the most productive day
  let maxHours = 0;
  for (const [day, hours] of Object.entries(eventsByDay)) {
    if (hours > maxHours) {
      maxHours = hours;
      result.mostProductiveDay = day;
    }
  }

  // Find the most productive hour
  let maxEvents = 0;
  for (const [hour, count] of Object.entries(eventsByHour)) {
    if (count > maxEvents) {
      maxEvents = count;
      result.mostProductiveHour = Number.parseInt(hour);
    }
  }

  return result;
}
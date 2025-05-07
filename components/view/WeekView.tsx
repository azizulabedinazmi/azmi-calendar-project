"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Edit3, Share2, Bookmark, Trash2 } from "lucide-react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isWithinInterval, add } from "date-fns"
import { zhCN, enUS } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { Language } from "@/lib/i18n"

interface WeekViewProps {
  date: Date
  events: any[]
  onEventClick: (event: any) => void
  onTimeSlotClick: (date: Date) => void
  language: Language
  firstDayOfWeek: number
  timezone: string
  onEditEvent?: (event: CalendarEvent) => void
  onDeleteEvent?: (event: CalendarEvent) => void
  onShareEvent?: (event: CalendarEvent) => void
  onBookmarkEvent?: (event: CalendarEvent) => void
  onEventDrop?: (event: CalendarEvent, newStartDate: Date, newEndDate: Date) => void // Add event drag handler function
}

interface CalendarEvent {
  id: string
  startDate: string | Date
  endDate: string | Date
  title: string
  color: string
  isAllDay?: boolean
}

export default function WeekView({
  date,
  events,
  onEventClick,
  onTimeSlotClick,
  language,
  firstDayOfWeek,
  timezone,
  onEditEvent,
  onDeleteEvent,
  onShareEvent,
  onBookmarkEvent,
  onEventDrop, // Add drag event handler function
}: WeekViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: firstDayOfWeek })
  const weekEnd = endOfWeek(date, { weekStartsOn: firstDayOfWeek })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const today = new Date()

  const [currentTime, setCurrentTime] = useState(new Date())
  const hasScrolledRef = useRef(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  
  // Drag-related state
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null)
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ day: Date; hour: number; minute: number } | null>(null)
  const [dragEventDuration, setDragEventDuration] = useState<number>(0) // Event duration in minutes
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDraggingRef = useRef(false)

  const menuLabels = {
    edit: language === "zh" ? "修改" : "Edit",
    share: language === "zh" ? "分享" : "Share",
    bookmark: language === "zh" ? "书签" : "Bookmark",
    delete: language === "zh" ? "删除" : "Delete",
  }

  function getDarkerColorClass(color: string) {
    const colorMapping: Record<string, string> = {
      'bg-blue-500': '#3C74C4',
      'bg-yellow-500': '#C39248',
      'bg-red-500': '#C14D4D',
      'bg-green-500': '#3C996C',
      'bg-purple-500': '#A44DB3',
      'bg-pink-500': '#C14D84',
      'bg-indigo-500': '#3D63B3',
      'bg-orange-500': '#C27048',
      'bg-teal-500': '#3C8D8D',
    }

    return colorMapping[color] || '#3A3A3A';
  }

  // Auto-scroll to current time effect, only execute once when component mounts
  useEffect(() => {
    // Only scroll once when the component mounts
    if (!hasScrolledRef.current && scrollContainerRef.current) {
      const now = new Date()
      const currentHour = now.getHours()

      // Find the DOM element for the current hour
      const hourElements = scrollContainerRef.current.querySelectorAll(".h-\\[60px\\]")
      if (hourElements.length > 0 && currentHour < hourElements.length) {
        // Get the element for the current hour
        const currentHourElement = hourElements[currentHour + 1] // +1 because the first row is for time labels

        if (currentHourElement) {
          // Scroll to the current hour position, with a 100px offset to position it in the upper middle of the view
          scrollContainerRef.current.scrollTo({
            top: (currentHourElement as HTMLElement).offsetTop - 100,
            behavior: "auto",
          })

          // Mark as scrolled
          hasScrolledRef.current = true
        }
      }
    }
  }, [date, weekDays])

  // Update time logic, only update the timeline position without changing scroll position
  useEffect(() => {
    // Update time immediately
    setCurrentTime(new Date())

    // Set a timer to update the time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      // No longer calling the scroll function
    }, 60000) // 60000 ms = 1 minute

    return () => clearInterval(interval)
  }, [])

  // Add global mouseup/mousemove listeners to handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingEvent && isDraggingRef.current && dragStartPosition && scrollContainerRef.current) {
        // Calculate mouse position relative to calendar container
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        const gridItems = scrollContainerRef.current.querySelectorAll('.grid-col');
        
        // Find the closest day column
        let closestDayIndex = 0;
        let minDistance = Infinity;
        
        gridItems.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const distance = Math.abs(e.clientX - centerX);
          
          if (distance < minDistance) {
            minDistance = distance;
            closestDayIndex = index;
          }
        });
        
        // Calculate hour and minute
        const relativeY = e.clientY - containerRect.top + scrollContainerRef.current.scrollTop;
        const hour = Math.floor(relativeY / 60);
        const minute = Math.floor((relativeY % 60) / 15) * 15; // Round to nearest 15 minutes
        
        if (closestDayIndex < weekDays.length) {
          setDragPreview({
            day: weekDays[closestDayIndex],
            hour: hour,
            minute: minute
          });
        }
      }
    };
    
    const handleMouseUp = () => {
      if (draggingEvent && isDraggingRef.current && dragPreview && onEventDrop) {
        // Calculate new start and end times
        const newStartDate = new Date(dragPreview.day);
        newStartDate.setHours(dragPreview.hour, dragPreview.minute, 0, 0);
        
        // Calculate new end time (keeping event duration constant)
        const newEndDate = add(newStartDate, { minutes: dragEventDuration });
        
        // Call callback function to update the event
        onEventDrop(draggingEvent, newStartDate, newEndDate);
      }
      
      // Clear drag state
      isDraggingRef.current = false;
      setDraggingEvent(null);
      setDragStartPosition(null);
      setDragOffset(null);
      setDragPreview(null);
    };
    
    // If dragging, add global event listeners
    if (draggingEvent) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingEvent, dragStartPosition, dragPreview, onEventDrop, weekDays, dragEventDuration]);

  const formatTime = (hour: number) => {
    // Format time using 24-hour format
    return `${hour.toString().padStart(2, "0")}:00`
  }

  const formatDateWithTimezone = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false, // Use 24-hour format
      timeZone: timezone,
    }
    return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", options).format(date)
  }

  // Check if event is an all-day event
  const isAllDayEvent = (event: CalendarEvent) => {
    if (event.isAllDay) return true
    
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)
    
    // Check if it's a 00:00-23:59 event or overnight event (00:00-next day 00:00)
    const isFullDay = 
      start.getHours() === 0 && 
      start.getMinutes() === 0 && 
      ((end.getHours() === 23 && end.getMinutes() === 59) || 
       (end.getHours() === 0 && end.getMinutes() === 0 && end.getDate() !== start.getDate()))
    
    return isFullDay
  }

  // Safely check if event spans multiple days
  const isMultiDayEvent = (start: Date, end: Date) => {
    if (!start || !end) return false

    return (
      start.getDate() !== end.getDate() ||
      start.getMonth() !== end.getMonth() ||
      start.getFullYear() !== end.getFullYear()
    )
  }

  // Check if event should be displayed on a specific day
  const shouldShowEventOnDay = (event: CalendarEvent, day: Date) => {
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)

    // If it's an all-day event spanning multiple days (00:00-next day 00:00), only show on start day
    if (isAllDayEvent(event) && isMultiDayEvent(start, end)) {
      return isSameDay(start, day)
    }

    // If the event starts on the current day
    if (isSameDay(start, day)) return true

    // If it's a multi-day event (and not an all-day event), check if current day is within event range
    if (isMultiDayEvent(start, end) && !isAllDayEvent(event)) {
      return isWithinInterval(day, { start, end })
    }

    return false
  }

  // Calculate event start and end times for a specific day
  const getEventTimesForDay = (event: CalendarEvent, day: Date) => {
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)

    // Safety check
    if (!start || !end) return null

    const isMultiDay = isMultiDayEvent(start, end)

    // Calculate start and end times for the day
    let dayStart = start
    let dayEnd = end

    if (isMultiDay) {
      // If not the event's start day, start from midnight
      if (!isSameDay(start, day)) {
        dayStart = new Date(day)
        dayStart.setHours(0, 0, 0, 0)
      }

      // If not the event's end day, end at midnight
      if (!isSameDay(end, day)) {
        dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)
      }
    }

    return {
      start: dayStart,
      end: dayEnd,
      isMultiDay,
    }
  }

  // Separate events into all-day events and regular events
  const separateEvents = (dayEvents: CalendarEvent[], day: Date) => {
    const allDayEvents: CalendarEvent[] = []
    const regularEvents: CalendarEvent[] = []

    dayEvents.forEach(event => {
      if (isAllDayEvent(event)) {
        allDayEvents.push(event)
      } else {
        regularEvents.push(event)
      }
    })

    return { allDayEvents, regularEvents }
  }

  // Improved event layout algorithm for handling overlapping events
  const layoutEventsForDay = (dayEvents: CalendarEvent[], day: Date) => {
    if (!dayEvents || dayEvents.length === 0) return []

    // Get event times for the day
    const eventsWithTimes = dayEvents
      .map((event) => {
        const times = getEventTimesForDay(event, day)
        if (!times) return null
        return { event, ...times }
      })
      .filter(Boolean) as Array<{
      event: CalendarEvent
      start: Date
      end: Date
      isMultiDay: boolean
    }>

    // Sort by start time
    eventsWithTimes.sort((a, b) => a.start.getTime() - b.start.getTime())

    // Create time point array, each time point includes active events during that time
    type TimePoint = { time: number; isStart: boolean; eventIndex: number }
    const timePoints: TimePoint[] = []

    // Add all event start and end time points
    eventsWithTimes.forEach((eventWithTime, index) => {
      const startTime = eventWithTime.start.getTime()
      const endTime = eventWithTime.end.getTime()

      timePoints.push({ time: startTime, isStart: true, eventIndex: index })
      timePoints.push({ time: endTime, isStart: false, eventIndex: index })
    })

    // Sort by time
    timePoints.sort((a, b) => {
      // If times are equal, end time points come before start time points
      if (a.time === b.time) {
        return a.isStart ? 1 : -1
      }
      return a.time - b.time
    })

    // Process each time point
    const eventLayouts: Array<{
      event: CalendarEvent
      start: Date
      end: Date
      column: number
      totalColumns: number
      isMultiDay: boolean
    }> = []

    // Currently active events
    const activeEvents = new Set<number>()
    // Event to column mapping
    const eventToColumn = new Map<number, number>()

    for (let i = 0; i < timePoints.length; i++) {
      const point = timePoints[i]

      if (point.isStart) {
        // Event starts
        activeEvents.add(point.eventIndex)

        // Find the lowest available column number
        let column = 0
        const usedColumns = new Set<number>()

        // Collect currently used columns
        activeEvents.forEach((eventIndex) => {
          if (eventToColumn.has(eventIndex)) {
            usedColumns.add(eventToColumn.get(eventIndex)!)
          }
        })

        // Find the first unused column
        while (usedColumns.has(column)) {
          column++
        }

        // Assign column
        eventToColumn.set(point.eventIndex, column)
      } else {
        // Event ends
        activeEvents.delete(point.eventIndex)
      }

      // If this is the last time point or the next time point is different, process current time segment
      if (i === timePoints.length - 1 || timePoints[i + 1].time !== point.time) {
        // Calculate layout for current active events
        const totalColumns =
          activeEvents.size > 0 ? Math.max(...Array.from(activeEvents).map((idx) => eventToColumn.get(idx)!)) + 1 : 0

        // Update total columns for all active events
        activeEvents.forEach((eventIndex) => {
          const column = eventToColumn.get(eventIndex)!
          const { event, start, end, isMultiDay } = eventsWithTimes[eventIndex]

          // Check if this event has already been added
          const existingLayout = eventLayouts.find((layout) => layout.event.id === event.id)

          if (!existingLayout) {
            eventLayouts.push({
              event,
              start,
              end,
              column,
              totalColumns: Math.max(totalColumns, 1),
              isMultiDay,
            })
          }
        })
      }
    }

    return eventLayouts
  }

  // Handle event drag start
  const handleEventDragStart = (event: CalendarEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use timer to simulate long press effect, about 300ms
    longPressTimeoutRef.current = setTimeout(() => {
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      
      // Calculate event duration in minutes
      const durationMs = end.getTime() - start.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      
      setDraggingEvent(event);
      setDragStartPosition({ x: e.clientX, y: e.clientY });
      setDragEventDuration(durationMinutes);
      isDraggingRef.current = true;
    }, 300);
  };
  
  // Handle event drag end
  const handleEventDragEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  // Handle time slot click, determine more precise time based on click position
  const handleTimeSlotClick = (day: Date, hour: number, event: React.MouseEvent<HTMLDivElement>) => {
    // Get relative position of click within the time cell
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeY = event.clientY - rect.top
    const cellHeight = rect.height

    // Determine minutes based on click position
    // If click is in the top half of the cell, minutes = 0, otherwise minutes = 30
    const minutes = relativeY < cellHeight / 2 ? 0 : 30

    // Create a new date object with the specified date, hour, and minutes
    const clickTime = new Date(day)
    clickTime.setHours(hour, minutes, 0, 0)

    // Call the provided callback function
    onTimeSlotClick(clickTime)
  }

  // Render all-day events function
  const renderAllDayEvents = (day: Date, allDayEvents: CalendarEvent[]) => {
    // Set the spacing size between events
    const eventSpacing = 2; // Adjust this value to change the spacing between events, in pixels
    
    return allDayEvents.map((event, index) => (
      <ContextMenu key={`allday-${event.id}-${day.toISOString().split("T")[0]}`}>
        <ContextMenuTrigger asChild>
          <div
            className={cn("relative rounded-lg p-1 text-xs cursor-pointer overflow-hidden", event.color)}
            style={{
              height: "20px",  // Fixed height
              // Use eventSpacing to set the spacing between events
              top: index * (20 + eventSpacing) + "px", // Stack events with spacing
              position: "absolute",
              left: "0",
              right: "0",
              opacity: 0.9,
              zIndex: 10 + index,
            }}
            onMouseDown={(e) => handleEventDragStart(event, e)}
            onMouseUp={handleEventDragEnd}
            onMouseLeave={handleEventDragEnd}
            onClick={(e) => {
              e.stopPropagation()
              if (!isDraggingRef.current) {
                onEventClick(event)
              }
            }}
          >
            <div 
              className={cn("absolute left-0 top-0 w-2 h-full rounded-l-md")} 
              style={{ backgroundColor: getDarkerColorClass(event.color) }} 
            />
            <div className="pl-1.5 truncate text-white">
              {event.title}
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="w-40">
          <ContextMenuItem onClick={() => onEditEvent?.(event)}>
            <Edit3 className="mr-2 h-4 w-4" />
            {menuLabels.edit}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onShareEvent?.(event)}>
            <Share2 className="mr-2 h-4 w-4" />
            {menuLabels.share}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onBookmarkEvent?.(event)}>
            <Bookmark className="mr-2 h-4 w-4" />
            {menuLabels.bookmark}
          </ContextMenuItem>
          <ContextMenuItem onClick={() => onDeleteEvent?.(event)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            {menuLabels.delete}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    ))
  }

  // Render drag preview
  const renderDragPreview = () => {
    if (!dragPreview || !draggingEvent) return null;
    
    const dayIndex = weekDays.findIndex(day => isSameDay(day, dragPreview.day));
    if (dayIndex === -1) return null;
    
    const startMinutes = dragPreview.hour * 60 + dragPreview.minute;
    const endMinutes = startMinutes + dragEventDuration;
    
    return (
      <div
        className={cn("absolute rounded-lg p-2 text-sm cursor-pointer overflow-hidden", draggingEvent.color)}
        style={{
          top: `${startMinutes}px`,
          height: `${dragEventDuration}px`,
          opacity: 0.6,
          width: `calc(100% - 4px)`,
          left: '2px',
          zIndex: 100,
          border: '2px dashed white',
          pointerEvents: 'none', // Ensure drag preview doesn't interfere with mouse events
        }}
      >
        <div className={cn("absolute left-0 top-0 w-2 h-full rounded-l-md")} 
          style={{ backgroundColor: getDarkerColorClass(draggingEvent.color) }} 
        />
        <div className="pl-1.5">
          <div className="font-medium text-white truncate">{draggingEvent.title}</div>
          {dragEventDuration >= 40 && (
            <div className="text-xs text-white/90 truncate">
              {formatTime(dragPreview.hour)}:{dragPreview.minute.toString().padStart(2, '0')} - {formatTime(Math.floor(endMinutes / 60))}:{(endMinutes % 60).toString().padStart(2, '0')}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[100px_repeat(7,1fr)] divide-x relative z-30 bg-background">
        <div className="sticky top-0 z-30 bg-background" />
        {weekDays.map((day) => {
          // Get events for the day
          const dayEvents = events.filter((event) => shouldShowEventOnDay(event, day))
          // Separate all-day events and regular events
          const { allDayEvents } = separateEvents(dayEvents, day)
          
          // Calculate all-day events area height, without spacing
          const eventSpacing = 2; // Keep the same value as in renderAllDayEvents function
          const allDayEventsHeight = allDayEvents.length > 0 
            ? allDayEvents.length * 20 + (allDayEvents.length - 1) * eventSpacing 
            : 0;
          
          return (
            <div key={day.toString()} className="sticky top-0 z-30 bg-background">
              <div className="p-2 text-center">
                <div>{format(day, "E", { locale: language === "zh" ? zhCN : enUS })}</div>
                {/* If today, highlight the date with blue */}
                <div className={cn(isSameDay(day, today) ? "text-[#0066FF] font-bold" : "")}>
                  {format(day, "d")}
                </div>
              </div>
              
              {/* All-day events area */}
              <div 
                className="relative" 
                style={{ height: allDayEventsHeight + "px" }}
              >
                {renderAllDayEvents(day, allDayEvents)}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex-1 grid grid-cols-[100px_repeat(7,1fr)] divide-x overflow-auto" ref={scrollContainerRef}>
        <div className="text-sm text-muted-foreground">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] relative">
              {/* Fix time label positioning, especially for 0:00 display */}
              <span className="absolute top-0 right-4 -translate-y-1/2">{formatTime(hour)}</span>
            </div>
          ))}
        </div>

        {weekDays.map((day, dayIndex) => {
          // Get events for the day
          const dayEvents = events.filter((event) => shouldShowEventOnDay(event, day))
          // Separate all-day events and regular events
          const { regularEvents } = separateEvents(dayEvents, day)
          // Layout the events
          const eventLayouts = layoutEventsForDay(regularEvents, day)

          return (
            <div key={day.toString()} className="relative border-l grid-col">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="h-[60px] border-t border-gray-200"
                  onClick={(e) => handleTimeSlotClick(day, hour, e)}
                />
              ))}

              {eventLayouts.map(({ event, start, end, column, totalColumns }) => {
                const startMinutes = start.getHours() * 60 + start.getMinutes()
                const endMinutes = end.getHours() * 60 + end.getMinutes()
                const duration = endMinutes - startMinutes

                // Set minimum height to ensure short events can display text
                const minHeight = 20 // Minimum height of 20px
                const height = Math.max(duration, minHeight)

                // Calculate event width and position, handling overlaps
                const width = `calc((100% - 4px) / ${totalColumns})`
                const left = `calc(${column} * ${width})`

                return (
                    <ContextMenu key={`${event.id}-${day.toISOString().split("T")[0]}`}>
                      <ContextMenuTrigger asChild>
                        <div
                          className={cn("relative absolute rounded-lg p-2 text-sm cursor-pointer overflow-hidden", event.color)}
                          style={{
                            top: `${startMinutes}px`,
                            height: `${height}px`,
                            opacity: 0.9,
                            width,
                            left,
                            zIndex: column + 1,
                          }}
                          onMouseDown={(e) => handleEventDragStart(event, e)}
                          onMouseUp={handleEventDragEnd}
                          onMouseLeave={handleEventDragEnd}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (!isDraggingRef.current) {
                              onEventClick(event)
                            }
                          }}
                        >
                         <div className={cn("absolute left-0 top-0 w-2 h-full rounded-l-md")} style={{ backgroundColor: getDarkerColorClass(event.color) }} />
                          <div className="pl-1.5">
                          <div className="font-medium text-white truncate">{event.title}</div>
                          {height >= 40 && (
                            <div className="text-xs text-white/90 truncate">
                              {formatDateWithTimezone(start)} - {formatDateWithTimezone(end)}
                            </div>
                          )}
                          </div>
                        </div>
                      </ContextMenuTrigger>
    
                    <ContextMenuContent className="w-40">
                      <ContextMenuItem onClick={() => onEditEvent?.(event)}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        {menuLabels.edit}
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => onShareEvent?.(event)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        {menuLabels.share}
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => onBookmarkEvent?.(event)}>
                        <Bookmark className="mr-2 h-4 w-4" />
                        {menuLabels.bookmark}
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => onDeleteEvent?.(event)} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        {menuLabels.delete}
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                )
              })}

              {/* If current date column is the target for drag preview, show the drag preview */}
              {dragPreview && isSameDay(dragPreview.day, day) && renderDragPreview()}

              {isSameDay(day, today) &&
                (() => {
                  // Get current time in the specified timezone
                  const timeOptions: Intl.DateTimeFormatOptions = {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                    timeZone: timezone,
                  }

                  // Get hours and minutes
                  const timeString = new Intl.DateTimeFormat("en-US", timeOptions).format(currentTime)
                  const [hoursStr, minutesStr] = timeString.split(":")
                  const currentHours = Number.parseInt(hoursStr, 10)
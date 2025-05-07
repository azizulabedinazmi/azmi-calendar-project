"use client"

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { Language } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { add, format, isSameDay, isWithinInterval } from "date-fns"
import { enUS, zhCN } from "date-fns/locale"
import { Bookmark, Edit3, Share2, Trash2 } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import type { CalendarEvent } from "../Calendar"

interface DayViewProps {
  date: Date
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onTimeSlotClick: (date: Date) => void
  language: Language
  timezone: string
  onEditEvent?: (event: CalendarEvent) => void
  onDeleteEvent?: (event: CalendarEvent) => void
  onShareEvent?: (event: CalendarEvent) => void
  onBookmarkEvent?: (event: CalendarEvent) => void
  onEventDrop?: (event: CalendarEvent, newStartDate: Date, newEndDate: Date) => void // Added event handler for dragging events
}

export default function DayView({ 
  date, 
  events, 
  onEventClick, 
  onTimeSlotClick, 
  language, 
  timezone,
  onEditEvent,
  onDeleteEvent,
  onShareEvent,
  onBookmarkEvent,
  onEventDrop
}: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const hasScrolledRef = useRef(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Drag-related states
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null)
  const [dragStartPosition, setDragStartPosition] = useState<{ x: number; y: number } | null>(null)
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
  const [dragPreview, setDragPreview] = useState<{ hour: number; minute: number } | null>(null)
  const [dragEventDuration, setDragEventDuration] = useState<number>(0) // Event duration in minutes
  const longPressTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isDraggingRef = useRef(false)

  const menuLabels = {
    edit: language === "zh" ? "修改" : "Edit",
    share: language === "zh" ? "分享" : "Share",
    bookmark: language === "zh" ? "书签" : "Bookmark",
    delete: language === "zh" ? "删除" : "Delete",
  }

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

  // Determine if an event is an all-day event
  const isAllDayEvent = (event: CalendarEvent) => {
    if (event.isAllDay) return true
    
    const start = new Date(event.startDate)
    const end = new Date(event.endDate)
    
    // Check if it's a 00:00-23:59 event or an overnight event (00:00-next day 00:00)
    const isFullDay = 
      start.getHours() === 0 && 
      start.getMinutes() === 0 && 
      ((end.getHours() === 23 && end.getMinutes() === 59) || 
       (end.getHours() === 0 && end.getMinutes() === 0 && end.getDate() !== start.getDate()))
    
    return isFullDay
  }

  // Check if an event spans multiple days
  const isMultiDayEvent = (start: Date, end: Date) => {
    return (
      start.getDate() !== end.getDate() ||
      start.getMonth() !== end.getMonth() ||
      start.getFullYear() !== end.getFullYear()
    )
  }

  // Separate events into all-day events and regular events
  const separateEvents = (dayEvents: CalendarEvent[]) => {
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

  // Auto-scroll to current time effect, only executed once when component mounts
  useEffect(() => {
    // Only execute scroll once when component mounts
    if (!hasScrolledRef.current && scrollContainerRef.current) {
      const now = new Date()
      const currentHour = now.getHours()

      // Find DOM element corresponding to current hour
      const hourElements = scrollContainerRef.current.querySelectorAll(".h-\\[60px\\]")
      if (hourElements.length > 0 && currentHour < hourElements.length) {
        // Get element for current hour
        const currentHourElement = hourElements[currentHour + 1] // +1 because first row is time labels

        if (currentHourElement) {
          // Scroll to current hour position, offset by 100px to position it in the upper-middle of the view
          scrollContainerRef.current.scrollTo({
            top: (currentHourElement as HTMLElement).offsetTop - 100,
            behavior: "auto",
          })

          // Mark as scrolled
          hasScrolledRef.current = true
        }
      }
    }
  }, [date])

  // Update time logic, only update timeline position without changing scroll position
  useEffect(() => {
    // Update time immediately
    setCurrentTime(new Date())

    // Set timer to update time every minute
    const interval = setInterval(() => {
      setCurrentTime(new Date())
      // No longer calling scroll function
    }, 60000) // 60000 ms = 1 minute

    return () => clearInterval(interval)
  }, [])

  // Add global mouseup/mousemove listeners to handle dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingEvent && isDraggingRef.current && dragStartPosition && scrollContainerRef.current) {
        // Calculate mouse position relative to calendar container
        const containerRect = scrollContainerRef.current.getBoundingClientRect();
        
        // Calculate hour and minute
        const relativeY = e.clientY - containerRect.top + scrollContainerRef.current.scrollTop;
        const hour = Math.floor(relativeY / 60);
        const minute = Math.floor((relativeY % 60) / 15) * 15; // Round to nearest 15 minutes
        
        setDragPreview({
          hour: hour,
          minute: minute
        });
      }
    };
    
    const handleMouseUp = () => {
      if (draggingEvent && isDraggingRef.current && dragPreview && onEventDrop) {
        // Calculate new start and end times
        const newStartDate = new Date(date);
        newStartDate.setHours(dragPreview.hour, dragPreview.minute, 0, 0);
        
        // Calculate new end time (keeping event duration unchanged)
        const newEndDate = add(newStartDate, { minutes: dragEventDuration });
        
        // Call callback function to update event
        onEventDrop(draggingEvent, newStartDate, newEndDate);
      }
      
      // Clear drag state
      isDraggingRef.current = false;
      setDraggingEvent(null);
      setDragStartPosition(null);
      setDragOffset(null);
      setDragPreview(null);
    };
    
    // If currently dragging, add global event listeners
    if (draggingEvent) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingEvent, dragStartPosition, dragPreview, onEventDrop, date, dragEventDuration]);

  // Get day's event layout
  const layoutEvents = (events: CalendarEvent[]) => {
    if (!events || events.length === 0) return []

    // Sort by start time
    const sortedEvents = [...events].sort((a, b) => {
      const startA = new Date(a.startDate).getTime()
      const startB = new Date(b.startDate).getTime()
      return startA - startB
    })

    // Create timepoints array, each timepoint contains events active during that time
    type TimePoint = { time: number; isStart: boolean; eventIndex: number }
    const timePoints: TimePoint[] = []

    // Add all event start and end timepoints
    sortedEvents.forEach((event, index) => {
      const start = new Date(event.startDate)
      const end = new Date(event.endDate)
      
      timePoints.push({ time: start.getTime(), isStart: true, eventIndex: index })
      timePoints.push({ time: end.getTime(), isStart: false, eventIndex: index })
    })

    // Sort by time
    timePoints.sort((a, b) => {
      // If times are the same, end timepoints come before start timepoints
      if (a.time === b.time) {
        return a.isStart ? 1 : -1
      }
      return a.time - b.time
    })

    // Process each timepoint
    const eventLayouts: Array<{
      event: CalendarEvent
      column: number
      totalColumns: number
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

        // Find first unused column
        while (usedColumns.has(column)) {
          column++
        }

        // Assign column
        eventToColumn.set(point.eventIndex, column)
      } else {
        // Event ends
        activeEvents.delete(point.eventIndex)
      }

      // If last timepoint or next timepoint differs from current, process current timepoint
      if (i === timePoints.length - 1 || timePoints[i + 1].time !== point.time) {
        // Calculate layout for current active events
        const totalColumns =
          activeEvents.size > 0 ? Math.max(...Array.from(activeEvents).map((idx) => eventToColumn.get(idx)!)) + 1 : 0

        // Update total columns for all active events
        activeEvents.forEach((eventIndex) => {
          const column = eventToColumn.get(eventIndex)!
          const event = sortedEvents[eventIndex]

          // Check if this event has already been added
          const existingLayout = eventLayouts.find((layout) => layout.event.id === event.id)

          if (!existingLayout) {
            eventLayouts.push({
              event,
              column,
              totalColumns: Math.max(totalColumns, 1),
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
      
      // Calculate event duration (minutes)
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
  const handleTimeSlotClick = (hour: number, event: React.MouseEvent<HTMLDivElement>) => {
    // Get relative position of click within time cell
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeY = event.clientY - rect.top
    const cellHeight = rect.height

    // Determine minutes based on click position
    // If clicked in upper half of cell, minutes = 0, otherwise minutes = 30
    const minutes = relativeY < cellHeight / 2 ? 0 : 30

    // Create new date object, set to current date with specified hour and minute
    const clickTime = new Date(date)
    clickTime.setHours(hour, minutes, 0, 0)

    // Call provided callback function
    onTimeSlotClick(clickTime)
  }

  // Render all-day events function
  const renderAllDayEvents = (allDayEvents: CalendarEvent[]) => {
    // Set spacing between events
    const eventSpacing = 3;
    
    return allDayEvents.map((event, index) => (
      <ContextMenu key={`allday-${event.id}`}>
        <ContextMenuTrigger asChild>
          <div
            className={cn("relative rounded-lg p-1 text-xs cursor-pointer overflow-hidden", event.color)}
            style={{
              height: "20px",
              top: index * (20 + eventSpacing) + "px",
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
    
    const startMinutes = dragPreview.hour * 60 + dragPreview.minute;
    const endMinutes = startMinutes + dragEventDuration;
    
    return (
      <div
        className={cn("absolute rounded-lg p-2 text-sm overflow-hidden", draggingEvent.color)}
        style={{
          top: `${startMinutes}px`,
          height: `${dragEventDuration}px`,
          opacity: 0.6,
          width: `calc(100% - 4px)`,
          left: '2px',
          zIndex: 100,
          border: '2px dashed white',
          pointerEvents: 'none',
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

  // Get events for the current date
  const dayEvents = events.filter(event => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    
    // For non-all-day events use original logic
    if (!isAllDayEvent(event)) {
      if (isSameDay(start, date)) return true;
      
      if (isMultiDayEvent(start, end)) {
        return isWithinInterval(date, { start, end });
      }
      
      return false;
    }

    if (isMultiDayEvent(start, end)) {
      return isSameDay(start, date);
    }
    
    return isSameDay(start, date);
  });
  
  // Separate all-day events and regular events
  const { allDayEvents, regularEvents } = separateEvents(dayEvents);
  
  // Calculate height of all-day events area
  const eventSpacing = 2; // Keep consistent with renderAllDayEvents function
  const allDayEventsHeight = allDayEvents.length > 0 
    ? allDayEvents.length * 20 + (allDayEvents.length - 1) * eventSpacing 
    : 0;
  
  // Layout regular events
  const eventLayouts = layoutEvents(regularEvents);

  return (
    <div className="flex flex-col h-full">
      <div className="grid grid-cols-[100px_1fr] border-b relative z-30 bg-background">
        <div className="py-2 text-center">
          <div className="text-sm text-muted-foreground">
            {format(date, "E", { locale: language === "zh" ? zhCN : enUS })}
          </div>
          <div className="text-3xl font-semibold text-blue-600">{format(date, "d")}</div>
        </div>
        <div className="p-2">
          {/* All-day events area */}
          <div 
            className="relative" 
            style={{ height: allDayEventsHeight + "px" }}
          >
            {renderAllDayEvents(allDayEvents)}
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[100px_1fr] overflow-auto" ref={scrollContainerRef}>
        <div className="text-sm text-muted-foreground">
          {hours.map((hour) => (
            <div key={hour} className="h-[60px] relative">
              <span className="absolute top-0 right-4 -translate-y-1/2">{formatTime(hour)}</span>
            </div>
          ))}
        </div>

        <div className="relative border-l">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-[60px] border-t border-gray-200 dark:border-gray-500"
              onClick={(e) => handleTimeSlotClick(hour, e)}
            />
          ))}

          {eventLayouts.map(({ event, column, totalColumns }) => {
            const start = new Date(event.startDate);
            const end = new Date(event.endDate);
            
            const startMinutes = start.getHours() * 60 + start.getMinutes()
            const endMinutes = end.getHours() * 60 + end.getMinutes()
            const duration = endMinutes - startMinutes

            // Ensure events don't extend beyond the day's time range
            const maxEndMinutes = 24 * 60 // Maximum midnight
            const displayDuration = Math.min(duration, maxEndMinutes - startMinutes)

            // Set minimum height to ensure short events can display text
            const minHeight = 20 // Minimum height 20px
            const height = Math.max(displayDuration, minHeight)

            // Calculate event width and position, handle overlaps
            const width = `calc((100% - 8px) / ${totalColumns})`
            const left = `calc(${column} * ${width})`

            return (
              <ContextMenu key={event.id}>
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

          {/* Drag preview */}
          {dragPreview && renderDragPreview()}

          {(() => {
            // Check if current date is today
            const today = new Date()
            const isToday = isSameDay(date, today)

            // Only show time indicator for today
            if (!isToday) return null

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
            const currentMinutes = Number.parseInt(minutesStr, 10)

            // Calculate pixel position
            const topPosition = currentHours * 60 + currentMinutes

            return (
              <div
                className="absolute left-0 right-0 border-t-2 border-[#0066FF] z-0"
                style={{
                  top: `${topPosition}px`,
                }}
              />
            )
          })()}
        </div>
      </div>

      {draggingEvent && (
        <div 
          className="fixed px-2 py-1 bg-black text-white rounded-md text-xs z-50 pointer-events-none"
          style={{
            left: dragOffset ? dragStartPosition!.x + dragOffset.x + 10 : dragStartPosition!.x + 10,
            top: dragOffset ? dragStartPosition!.y + dragOffset.y + 10 : dragStartPosition!.y + 10,
            opacity: 0.8,
          }}
        >
          {language === "zh" ? "拖动到新位置" : "Drag to new position"}
        </div>
      )}
    </div>
  )
}
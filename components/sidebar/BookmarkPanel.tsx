"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLanguage } from "@/hooks/useLanguage";
import { translations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { enUS, zhCN } from "date-fns/locale";
import { Bookmark, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface BookmarkPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventClick: (event: any) => void;
}

interface BookmarkedEvent {
  id: string;
  title: string;
  startDate: string | Date;
  endDate: string | Date;
  color: string;
  location?: string;
  bookmarkedAt: string;
}

export default function BookmarkPanel({ open, onOpenChange, onEventClick }: BookmarkPanelProps) {
  const [language] = useLanguage();
  const t = translations[language];
  const [bookmarks, setBookmarks] = useState<BookmarkedEvent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Load bookmarks from localStorage
  useEffect(() => {
    if (open) {
      const storedBookmarks = localStorage.getItem("bookmarked-events");
      if (storedBookmarks) {
        try {
          const parsedBookmarks = JSON.parse(storedBookmarks);
          // Sort by bookmarked date (newest first)
          parsedBookmarks.sort(
            (a: BookmarkedEvent, b: BookmarkedEvent) =>
              new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()
          );
          setBookmarks(parsedBookmarks);
        } catch (error) {
          console.error("Error parsing bookmarks:", error);
          setBookmarks([]);
        }
      }
    }
  }, [open]);

  // Format date for display
  const formatEventDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return format(date, "yyyy-MM-dd HH:mm", { locale: language === "zh" ? zhCN : enUS });
  };

  // Remove bookmark
  const removeBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedBookmarks = bookmarks.filter((bookmark) => bookmark.id !== id);
    localStorage.setItem("bookmarked-events", JSON.stringify(updatedBookmarks));
    setBookmarks(updatedBookmarks);
    toast("Bookmark Removed", {
      description: "Event has been removed from your bookmarks",
    });
  };

  // Handle event click
  const handleEventClick = (event: BookmarkedEvent) => {
    // Close the bookmark panel
    onOpenChange(false);

    // Trigger the event click handler
    onEventClick(event);
  };

  // Filter bookmarks based on search term
  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bookmark.location && bookmark.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[350px] sm:w-[400px] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center">
            <Bookmark className="mr-2 h-5 w-5" />
            Bookmarks
          </SheetTitle>
        </SheetHeader>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search bookmarks..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ScrollArea className="h-[calc(100vh-180px)] pr-4">
            {filteredBookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground">
                <Bookmark className="h-10 w-10 mb-2 opacity-20" />
                {searchTerm ? (
                  <p>No matching bookmarks found</p>
                ) : (
                  <p>You haven't bookmarked any events yet</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredBookmarks.map((bookmark) => (
                  <div
                    key={bookmark.id}
                    className="flex items-start p-3 border rounded-md hover:bg-accent cursor-pointer group"
                    onClick={() => handleEventClick(bookmark)}
                  >
                    <div className={cn("w-1.5 self-stretch rounded-full mr-3", bookmark.color)} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{bookmark.title}</h4>
                      <p className="text-sm text-muted-foreground">{formatEventDate(bookmark.startDate)}</p>
                      {bookmark.location && (
                        <p className="text-xs text-muted-foreground truncate mt-1">{bookmark.location}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => removeBookmark(bookmark.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
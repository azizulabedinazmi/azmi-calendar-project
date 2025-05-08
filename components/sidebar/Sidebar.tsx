"use client"

import { useCalendar } from "@/components/context/CalendarContext"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { translations } from "@/lib/i18n"
import { cn } from "@/lib/utils"
import { Calendar as CalendarIcon, ChevronDown, Plus, X } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface SidebarProps {
  onCreateEvent: () => void
  onDateSelect: (date: Date) => void
  onViewChange?: (view: string) => void
  language?: "en"
  selectedDate?: Date
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export type Language = "en"

export interface CalendarCategory {
  id: string
  name: string
  color: string
  keywords?: string[]
}

export default function Sidebar({
  onCreateEvent,
  onDateSelect,
  onViewChange,
  language = "en",
  selectedDate,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {

  const { calendars, addCategory: addCategoryToContext, removeCategory: removeCategoryFromContext } = useCalendar()

  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryColor, setNewCategoryColor] = useState("bg-blue-500")
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [localSelectedDate, setLocalSelectedDate] = useState<Date | undefined>(selectedDate || new Date())
  const [manageCategoriesOpen, setManageCategoriesOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null)
  const t = translations.en // Always use English translations

  const deleteText = {
    title: "Delete confirmation",
    description: "Are you sure you want to delete this category? This action cannot be undone.",
    cancel: "Cancel",
    delete: "Delete",
    toastSuccess: "Category deleted",
    toastDescription: "Category has been deleted successfully"
  }
  
  if (selectedDate && (!localSelectedDate || selectedDate.getTime() !== localSelectedDate.getTime())) {
    setLocalSelectedDate(selectedDate)
  }

  const addCategory = () => {
    if (newCategoryName.trim()) {
      const newCategory: CalendarCategory = {
        id: Date.now().toString(),
        name: newCategoryName.trim(),
        color: newCategoryColor,
        keywords: [],
      }
      addCategoryToContext(newCategory)
      setNewCategoryName("")
      setNewCategoryColor("bg-blue-500")
      setShowAddCategory(false)
      toast(t.categoryAdded || "Category added", {
        description: `${t.categoryAddedDesc || "Successfully added"} "${newCategoryName}" ${t.category || "category"}`,
      })
    }
  }

  const handleDeleteClick = (id: string) => {
    setCategoryToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (categoryToDelete) {
      removeCategoryFromContext(categoryToDelete)
      toast(deleteText.toastSuccess, {
        description: deleteText.toastDescription,
      })
    }
    setDeleteDialogOpen(false)
    setCategoryToDelete(null)
  }

  // Add a check to ensure translations are loaded
  if (!t || !t.oneCalendar) {
    return null
  }

  return (
    <div className={cn(
      "border-r bg-background overflow-y-auto transition-all duration-300 ease-in-out",
      isCollapsed ? "w-0 opacity-0 overflow-hidden" : "w-72 opacity-100"
    )}>
      <div className="p-4">
        <div className="flex items-center mb-4">
          <CalendarIcon className="h-6 w-6 text-[#0066ff] mr-2" />
          <h1 className="text-lg font-semibold">{t.oneCalendar}</h1>
        </div>

        <Button
          className="w-full justify-center bg-[#0066FF] text-white hover:bg-[#0052CC] mb-4 h-10"
          onClick={onCreateEvent}
        >
          {t.createEvent}
        </Button>

        <div className="mt-4">
          <Calendar
            mode="single"
            selected={localSelectedDate}
            onSelect={(date) => {
              setLocalSelectedDate(date)
              date && onDateSelect(date)
            }}
            className="rounded-md border"
          />
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{t.myCalendars}</span>
            <ChevronDown className="h-4 w-4" />
          </div>
          {calendars.map((calendar) => (
            <div key={calendar.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={cn("h-3 w-3 rounded-sm", calendar.color)} />
                <span className="text-sm">{calendar.name}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(calendar.id)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {showAddCategory ? (
            <div className="flex items-center space-x-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t.categoryName || "New calendar name"}
                className="text-sm"
              />
              <Button size="sm" onClick={addCategory}>
                {t.addCategory || "Add"}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setManageCategoriesOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t.addNewCalendar}
            </Button>
          )}
        </div>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{deleteText.title}</DialogTitle>
            <DialogDescription>
              {deleteText.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              {deleteText.cancel}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {deleteText.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageCategoriesOpen} onOpenChange={setManageCategoriesOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.createCategories}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t.categoryName}</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t.categoryName}
              />
            </div>
            <div className="space-y-2">
              <Label>{t.color}</Label>
              <div className="grid grid-cols-4 gap-2">
                {["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-gray-500"].map((color) => (
                  <button
                    key={color}
                    className={cn(
                      "h-8 w-8 rounded-full",
                      color,
                      newCategoryColor === color && "ring-2 ring-offset-2 ring-black"
                    )}
                    onClick={() => setNewCategoryColor(color)}
                  />
                ))}
              </div>
            </div>
            <Button onClick={addCategory} className="w-full">
              {t.addCategory}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

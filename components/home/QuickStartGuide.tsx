"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog"
import { useLanguage } from "@/hooks/useLanguage"
import { useLocalStorage } from "@/hooks/useLocalStorage"
import { translations } from "@/lib/i18n"
import {
    BarChart3Icon,
    CloudIcon,
    ImportIcon,
    KeyboardIcon,
    Share2Icon,
    SunIcon,
} from "lucide-react"
import type { FC, ReactNode } from "react"
import { useEffect, useState } from "react"

interface FeatureProps {
    icon: ReactNode
    title: string
    description: string
}

const Feature: FC<FeatureProps> = ({ icon, title, description }) => (
    <div className="flex flex-col items-start p-6 border rounded-2xl shadow-sm bg-white hover:shadow-md transition">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-semibold mb-1">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
    </div>
)

const QuickStartGuide: FC = () => {
    const [open, setOpen] = useState(false)
    const [hasSeenGuide, setHasSeenGuide] = useLocalStorage("has-seen-quick-start-guide", true)
    const [activeTab, setActiveTab] = useState("basics")
    const [language] = useLanguage()
    const t = translations.en // Always use English translations

    useEffect(() => {
        if (!hasSeenGuide) {
            setOpen(true)
        }
    }, [hasSeenGuide])

    const handleClose = () => {
        setOpen(false)
        setHasSeenGuide(true)
    }

    // Add a check to ensure translations are loaded
    if (!t || !t.welcomeToOneCalendar) {
        return null
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{t.welcomeToOneCalendar}</DialogTitle>
                    <DialogDescription>{t.powerfulCalendarApp}</DialogDescription>
                </DialogHeader>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Feature
                        icon={<CloudIcon className="h-6 w-6 text-blue-500" />}
                        title={t.cloudSync}
                        description={t.cloudSyncDescription}
                    />
                    <Feature
                        icon={<Share2Icon className="h-6 w-6 text-green-500" />}
                        title={t.easySharing}
                        description={t.easySharingDescription}
                    />
                    <Feature
                        icon={<BarChart3Icon className="h-6 w-6 text-purple-500" />}
                        title={t.analytics}
                        description={t.analyticsDescription}
                    />
                    <Feature
                        icon={<SunIcon className="h-6 w-6 text-yellow-500" />}
                        title={t.weatherIntegration}
                        description={t.weatherIntegrationDescription}
                    />
                    <Feature
                        icon={<KeyboardIcon className="h-6 w-6 text-red-500" />}
                        title={t.keyboardShortcuts}
                        description={t.keyboardShortcutsDescription}
                    />
                    <Feature
                        icon={<ImportIcon className="h-6 w-6 text-pink-500" />}
                        title={t.importExport}
                        description={t.importExportDescription}
                    />
                </section>
            </DialogContent>
        </Dialog>
    )
}

export default QuickStartGuide

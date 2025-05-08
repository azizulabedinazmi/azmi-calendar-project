declare module "lucide-react" {
  import { FC, SVGProps } from "react"
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string
    color?: string
    strokeWidth?: number | string
  }
  export const CloudIcon: FC<IconProps>
  export const Share2Icon: FC<IconProps>
  export const BarChart3Icon: FC<IconProps>
  export const SunIcon: FC<IconProps>
  export const KeyboardIcon: FC<IconProps>
  export const ImportIcon: FC<IconProps>
}

declare module "@/hooks/useLanguage" {
  export function useLanguage(): ["en", (lang: "en") => void]
}

declare module "@/hooks/useLocalStorage" {
  export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void]
}

declare module "@/lib/i18n" {
  export const translations: {
    en: {
      welcomeToOneCalendar: string
      powerfulCalendarApp: string
      cloudSync: string
      cloudSyncDescription: string
      easySharing: string
      easySharingDescription: string
      analytics: string
      analyticsDescription: string
      weatherIntegration: string
      weatherIntegrationDescription: string
      keyboardShortcuts: string
      keyboardShortcutsDescription: string
      importExport: string
      importExportDescription: string
    }
  }
} 
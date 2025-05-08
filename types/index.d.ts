declare module "react" {
  export type FC<P = {}> = React.FunctionComponent<P>
  export type ReactNode = React.ReactNode
  export type SVGProps<T> = React.SVGProps<T>
  export interface FunctionComponent<P = {}> {
    (props: P & { children?: ReactNode }): ReactElement<any, any> | null
  }
  export interface ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> {
    type: T
    props: P
    key: Key | null
  }
  export type Key = string | number
  export type JSXElementConstructor<P> = ((props: P) => ReactElement<any, any> | null) | (new (props: P) => Component<any, any>)
  export class Component<P = {}, S = {}> {
    constructor(props: P)
    props: Readonly<P>
    state: Readonly<S>
    setState(state: S | ((prevState: S) => S)): void
    render(): ReactElement<any, any> | null
  }
  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void]
  export function useEffect(effect: () => void | (() => void), deps?: any[]): void
  export function useRef<T>(initialValue: T): { current: T }
  export const Suspense: FC<{ children: ReactNode }>

  export interface DetailedHTMLProps<E extends HTMLAttributes<T>, T> {
    key?: Key | null | undefined
    ref?: LegacyRef<T> | undefined
  } & E

  export interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
    className?: string
    id?: string
    style?: CSSProperties
  }

  export interface AriaAttributes {
    "aria-label"?: string
  }

  export interface DOMAttributes<T> {
    children?: ReactNode
    dangerouslySetInnerHTML?: {
      __html: string
    }
    onClick?: (event: MouseEvent<T>) => void
  }

  export interface CSSProperties {
    [key: string]: string | number | undefined
  }

  export type LegacyRef<T> = string | Ref<T>

  export type Ref<T> = { current: T | null } | ((instance: T | null) => void)

  export interface MouseEvent<T> extends Event {
    currentTarget: EventTarget & T
  }

  export interface Event {
    preventDefault(): void
    stopPropagation(): void
  }

  export interface EventTarget {
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void
  }
}

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
  export const ChevronLeft: FC<IconProps>
  export const ChevronRight: FC<IconProps>
  export const PanelLeft: FC<IconProps>
  export const Search: FC<IconProps>
}

declare module "date-fns" {
  export function addDays(date: Date, amount: number): Date
  export function subDays(date: Date, amount: number): Date
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
      searchEventsPlaceholder: string
      day: string
      week: string
      month: string
      todayButton: string
      [key: string]: string
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
      h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
      p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>
      section: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
      input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>
    }
  }
} 
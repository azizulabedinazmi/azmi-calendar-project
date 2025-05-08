declare module "lucide-react" {
  import { FC, SVGProps } from "react"
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string
    absoluteStrokeWidth?: boolean
  }
  
  export const Calendar: FC<IconProps>
  export const ChevronDown: FC<IconProps>
  export const Plus: FC<IconProps>
  export const X: FC<IconProps>
}

declare module "sonner" {
  export const toast: {
    (message: string, options?: {
      description?: string
      duration?: number
      action?: {
        label: string
        onClick: () => void
      }
    }): void
  }
}

declare namespace JSX {
  interface IntrinsicElements {
    div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>
    button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
    span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>
    h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>
  }
} 
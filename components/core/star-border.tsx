import { cn } from "@/lib/utils"
import { ElementType, ComponentPropsWithoutRef } from "react"

interface StarBorderProps<T extends ElementType> {
  as?: T
  color?: string
  speed?: string
  className?: string
  innerClassName?: string
  children: React.ReactNode
}

export function StarBorder<T extends ElementType = "button">({
  as,
  className,
  innerClassName,
  color,
  speed = "6s",
  children,
  ...props
}: StarBorderProps<T> & Omit<ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const Component = as || "button"
  const defaultColor = color || "rgba(59, 130, 246, 0.95)"
  const defaultInnerClassName = innerClassName || "py-4 px-6"

  return (
    <Component 
      className={cn(
        "relative inline-flex overflow-visible rounded-[20px]",
        className
      )} 
      {...props}
    >
      <span className="pointer-events-none absolute -inset-4">
        <span
          className="absolute w-[420%] h-[85%] bottom-[-22px] right-[-300%] rounded-full z-0"
          style={{
            background: `radial-gradient(circle at center, ${defaultColor}, transparent 55%)`,
            animation: `star-movement-bottom ${speed} linear infinite`,
            opacity: 0.9,
            filter: 'blur(4px)',
            mixBlendMode: 'screen',
          }}
        />
        <span
          className="absolute w-[420%] h-[85%] top-[-22px] left-[-300%] rounded-full z-0"
          style={{
            background: `radial-gradient(circle at center, ${defaultColor}, transparent 55%)`,
            animation: `star-movement-top ${speed} linear infinite`,
            opacity: 0.9,
            filter: 'blur(4px)',
            mixBlendMode: 'screen',
          }}
        />
        <span
          className="absolute inset-0 rounded-[28px]"
          style={{
            boxShadow: `0 0 45px 12px ${defaultColor}`,
            opacity: 0.5,
            filter: 'blur(12px)',
            mixBlendMode: 'screen',
          }}
        />
      </span>
      <div className={cn(
        "relative z-10 border text-foreground text-center text-base rounded-[20px]",
        "bg-gradient-to-b from-background/90 via-background/70 to-muted/90 border-border/30",
        "dark:from-background dark:to-muted dark:border-border",
        defaultInnerClassName
      )}>
        {children}
      </div>
    </Component>
  )
}

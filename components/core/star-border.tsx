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
  const defaultColor = color || "hsl(var(--foreground))"
  const defaultInnerClassName = innerClassName || "py-4 px-6"

  return (
    <Component 
      className={cn(
        "relative inline-block py-[1px] overflow-hidden rounded-[20px]",
        className
      )} 
      {...props}
    >
      <div
        className="absolute w-[360%] h-[70%] bottom-[-18px] right-[-260%] rounded-full z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${defaultColor}, transparent 45%)`,
          animation: `star-movement-bottom ${speed} linear infinite`,
          opacity: 0.65,
          filter: 'blur(2px)',
        }}
      />
      <div
        className="absolute w-[360%] h-[70%] top-[-18px] left-[-260%] rounded-full z-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at center, ${defaultColor}, transparent 45%)`,
          animation: `star-movement-top ${speed} linear infinite`,
          opacity: 0.65,
          filter: 'blur(2px)',
        }}
      />
      <div className={cn(
        "relative z-1 border text-foreground text-center text-base rounded-[20px]",
        "bg-gradient-to-b from-background/90 to-muted/90 border-border/40",
        "dark:from-background dark:to-muted dark:border-border",
        defaultInnerClassName
      )}>
        {children}
      </div>
    </Component>
  )
}

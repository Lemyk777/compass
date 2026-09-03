import * as React from "react"
import { cn } from "@/lib/utils"

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "reading" | "dashboard" | "full"
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, size = "dashboard", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "mx-auto w-full",
          "px-4 sm:px-8 lg:px-10 xl:px-12 2xl:px-14",
          {
            "max-w-7xl": size === "reading",
            "max-w-[100rem]": size === "dashboard",
            "max-w-full": size === "full",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Container.displayName = "Container"

export { Container }

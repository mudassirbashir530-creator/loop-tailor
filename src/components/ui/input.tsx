import * as React from "react"

import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <input
          type={type}
          className={cn(
            "flex h-14 w-full rounded-2xl bg-white px-4 py-2 text-sm shadow-sm transition-all border-none ring-1 ring-[#0D3D33]/10 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#4A5568]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3D33]/20 disabled:cursor-not-allowed disabled:opacity-50",
            error && "ring-destructive focus-visible:ring-destructive",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="text-[0.8rem] font-medium text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }

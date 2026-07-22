import * as React from "react"
import { Search } from "lucide-react"

import { cn } from "../../lib/utils"

export interface SearchBarProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const SearchBar = React.forwardRef<HTMLInputElement, SearchBarProps>(
  ({ className, type = "search", ...props }, ref) => {
    return (
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <input
          type={type}
          className={cn(
            "flex h-14 w-full rounded-2xl bg-white pl-10 pr-4 py-2 text-sm shadow-sm transition-all border-none ring-1 ring-[#0D3D33]/10 placeholder:text-[#4A5568]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D3D33]/20 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
SearchBar.displayName = "SearchBar"

export { SearchBar }

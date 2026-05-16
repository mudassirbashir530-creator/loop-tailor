import * as React from "react"
import { cn } from "../../lib/utils"

const Select = ({ value, onValueChange, children }: any) => {
  return (
    <select 
      value={value} 
      onChange={(e) => onValueChange(e.target.value)}
      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </select>
  );
};

const SelectTrigger = ({ children }: any) => children;
const SelectValue = ({ placeholder }: any) => null;
const SelectContent = ({ children }: any) => children;
const SelectItem = ({ value, children }: any) => (
  <option value={value}>{children}</option>
);

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }

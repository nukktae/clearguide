import * as React from "react";
import { cn } from "@/src/lib/utils/cn";
import { Check } from "lucide-react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className="flex items-start gap-2.5 cursor-pointer group">
        <div className="relative shrink-0 mt-0.5">
          <input
            type="checkbox"
            className="sr-only peer"
            ref={ref}
            {...props}
          />
          <div className="w-5 h-5 rounded border-2 border-[#D0D4DA] dark:border-gray-500 bg-white dark:bg-gray-700 peer-checked:bg-[#0A1A2F] dark:peer-checked:bg-white peer-checked:border-[#0A1A2F] dark:peer-checked:border-white transition-colors flex items-center justify-center group-hover:border-[#0A1A2F] dark:group-hover:border-gray-400">
            <Check
              className="h-3.5 w-3.5 text-white dark:peer-checked:text-gray-900 opacity-0 peer-checked:opacity-100 transition-opacity"
              strokeWidth={3}
            />
          </div>
        </div>
        {label && (
          <span className="text-[13px] text-[#6D6D6D] dark:text-gray-400 leading-relaxed select-none">
            {label}
          </span>
        )}
      </label>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };


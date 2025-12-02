import * as React from "react";
import { cn } from "@/src/lib/utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#0A1A2F] text-white hover:bg-[#102C48] focus-visible:ring-[#0A1A2F] font-bold",
        secondary:
          "bg-[#2DB7A3] text-white hover:bg-[#2DB7A3]/90 focus-visible:ring-[#2DB7A3]",
        outline:
          "border border-[#D0D4DA] dark:border-gray-600 text-[#0A1A2F] dark:text-gray-200 hover:bg-[#F8FAFC] dark:hover:bg-gray-800 focus-visible:ring-[#0A1A2F] dark:focus-visible:ring-gray-400",
        ghost: "hover:bg-[#F4F6F9] dark:hover:bg-gray-800 text-[#3C3C3C] dark:text-gray-300",
      },
      size: {
        default: "h-[50px] min-h-[44px] px-4 py-2",
        sm: "h-9 min-h-[44px] px-3",
        lg: "h-[52px] min-h-[44px] px-8",
        icon: "h-10 w-10 min-h-[44px] min-w-[44px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };


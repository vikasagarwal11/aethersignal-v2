import { forwardRef, InputHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-gray-700 bg-gray-800 text-gray-50 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/50",
        error:
          "border-danger-500 bg-gray-800 text-gray-50 focus-visible:border-danger-500 focus-visible:ring-2 focus-visible:ring-danger-500/50",
        success:
          "border-success-500 bg-gray-800 text-gray-50 focus-visible:border-success-500 focus-visible:ring-2 focus-visible:ring-success-500/50",
      },
      inputSize: {
        sm: "h-8 text-xs",
        md: "h-10 text-sm",
        lg: "h-12 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "md",
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  error?: string;
  helperText?: string;
  label?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      inputSize,
      error,
      helperText,
      label,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const finalVariant = hasError ? "error" : variant;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-200">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          
          <input
            className={cn(
              inputVariants({ variant: finalVariant, inputSize, className }),
              leftIcon && "pl-10",
              rightIcon && "pr-10"
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <p
            className={cn(
              "text-xs",
              hasError ? "text-danger-500" : "text-gray-400"
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

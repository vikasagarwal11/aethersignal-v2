import { forwardRef, TextareaHTMLAttributes, useEffect, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textareaVariants = cva(
  "flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-gray-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none",
  {
    variants: {
      variant: {
        default:
          "border-gray-700 bg-gray-800 text-gray-50 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/50",
        error:
          "border-danger-500 bg-gray-800 text-gray-50 focus-visible:border-danger-500 focus-visible:ring-2 focus-visible:ring-danger-500/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: string;
  helperText?: string;
  label?: string;
  maxLength?: number;
  showCount?: boolean;
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      error,
      helperText,
      label,
      maxLength,
      showCount = false,
      autoResize = false,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const hasError = !!error;
    const finalVariant = hasError ? "error" : variant;
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const textareaRef = (ref as any) || internalRef;

    // Auto-resize functionality
    useEffect(() => {
      if (autoResize && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }, [value, autoResize, textareaRef]);

    const currentLength = value?.toString().length || 0;

    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-200">
            {label}
            {props.required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          className={cn(textareaVariants({ variant: finalVariant, className }))}
          ref={textareaRef}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          {...props}
        />

        <div className="flex items-center justify-between">
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

          {showCount && maxLength && (
            <p
              className={cn(
                "text-xs ml-auto",
                currentLength > maxLength * 0.9
                  ? "text-warning-500"
                  : "text-gray-400"
              )}
            >
              {currentLength} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

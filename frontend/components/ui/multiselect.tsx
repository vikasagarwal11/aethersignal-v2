"use client";

import * as React from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface MultiSelectOption {
  id: string;
  label: string;
  email?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onSelectionChange,
  placeholder = "Select items...",
  searchPlaceholder = "Search...",
  emptyMessage = "No items found.",
  className,
  disabled = false,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    
    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.email?.toLowerCase().includes(query) ||
        option.id.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  // Get selected options for display
  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => selected.includes(option.id));
  }, [options, selected]);

  const handleToggle = (optionId: string) => {
    if (selected.includes(optionId)) {
      onSelectionChange(selected.filter((id) => id !== optionId));
    } else {
      onSelectionChange([...selected, optionId]);
    }
  };

  const handleRemove = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selected.filter((id) => id !== optionId));
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between min-h-10 h-auto py-2",
            className,
            disabled && "cursor-not-allowed opacity-50"
          )}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-gray-400 text-sm">{placeholder}</span>
            ) : (
              <>
                {selectedOptions.slice(0, 2).map((option) => (
                  <span
                    key={option.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-500/20 text-primary-200 text-xs"
                  >
                    {option.label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-primary-100"
                      onClick={(e) => handleRemove(option.id, e)}
                    />
                  </span>
                ))}
                {selected.length > 2 && (
                  <span className="text-xs text-gray-400 px-1">
                    +{selected.length - 2} more
                  </span>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {selected.length > 0 && (
              <X
                className="h-4 w-4 text-gray-400 hover:text-gray-200 cursor-pointer"
                onClick={handleClearAll}
              />
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start" sideOffset={4}>
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 bg-gray-800 border-gray-700 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-400">
                {emptyMessage}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const isSelected = selected.includes(option.id);
                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "relative flex items-center rounded-sm px-2 py-1.5 text-sm cursor-pointer select-none outline-none transition-colors",
                        "hover:bg-gray-700 focus:bg-gray-700",
                        isSelected && "bg-primary-500/20"
                      )}
                      onClick={() => handleToggle(option.id)}
                    >
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className={cn(
                            "flex h-4 w-4 items-center justify-center rounded-sm border border-gray-600",
                            isSelected && "bg-primary-500 border-primary-500"
                          )}
                        >
                          {isSelected && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-gray-50 truncate">
                            {option.label}
                          </span>
                          {option.email && (
                            <span className="text-xs text-gray-400 truncate">
                              {option.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer with selection count */}
          {selected.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-700 text-xs text-gray-400">
              {selected.length} {selected.length === 1 ? "member" : "members"} selected
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}


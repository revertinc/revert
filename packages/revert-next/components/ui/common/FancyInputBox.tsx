"use client";

import * as React from "react";
import { Button, Badge,   Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,  
  Popover,
  PopoverContent,
  PopoverTrigger,} from "@revertdotdev/components";
import { cn } from "@revertdotdev/utils";
import { Icons } from "@revertdotdev/icons";

type Framework = Record<"value" | "label" | "color", string>;

const FRAMEWORKS = [
  {
    value: "next.js",
    label: "Next.js",
    color: "#ef4444",
  },
  {
    value: "sveltekit",
    label: "SvelteKit",
    color: "#eab308",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
    color: "#22c55e",
  },
  {
    value: "remix",
    label: "Remix",
    color: "#06b6d4",
  },
  {
    value: "astro",
    label: "Astro",
    color: "#3b82f6",
  },
  {
    value: "wordpress",
    label: "WordPress",
    color: "#8b5cf6",
  },
] satisfies Framework[];

const badgeStyle = (color: string) => ({
  borderColor: `${color}20`,
  backgroundColor: `${color}30`,
  color,
});

export function FancyInputBox() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [frameworks] = React.useState<Framework[]>(FRAMEWORKS);
  const [openCombobox, setOpenCombobox] = React.useState(false);
  const [inputValue, setInputValue] = React.useState<string>("");
  const [selectedValues, setSelectedValues] = React.useState<Framework[]>([
    FRAMEWORKS[0],
  ]);

  const toggleFramework = (framework: Framework) => {
    setSelectedValues((currentFrameworks) =>
      !currentFrameworks.includes(framework)
        ? [...currentFrameworks, framework]
        : currentFrameworks.filter((l) => l.value !== framework.value)
    );
    inputRef?.current?.focus();
  };


  const onComboboxOpenChange = (value: boolean) => {
    inputRef.current?.blur(); // HACK: otherwise, would scroll automatically to the bottom of page
    setOpenCombobox(value);
  };

  return (
    <div className="max-w-full">
      <Popover open={openCombobox} onOpenChange={onComboboxOpenChange}>
        <PopoverTrigger asChild>
          <div
            aria-expanded={openCombobox}
            className="flex h-9 w-full rounded-md border border-gray-25 bg-primary-950 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-primary-950 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 focus:bg-transparent focus:border-gray-50/70 items-center"
          >
            <span className="truncate">
              {selectedValues.length === 0 && "Select labels"}
              {selectedValues.length === 1 && selectedValues[0].label}
              {selectedValues.length === 2 &&
                selectedValues.map(({ label }) => label).join(", ")}
              {selectedValues.length > 2 &&
                `${selectedValues.length} labels selected`}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command loop>
            <CommandInput
              ref={inputRef}
              placeholder="Search framework..."
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              <CommandGroup className="max-h-[100px] overflow-auto">
                {frameworks.map((framework) => {
                  const isActive = selectedValues.includes(framework);
                  return (
                    <CommandItem
                      key={framework.value}
                      value={framework.value}
                      onSelect={() => toggleFramework(framework)}
                    >
                      <Icons.check
                        className={cn(
                          "mr-2 h-4 w-4",
                          isActive ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex-1">{framework.label}</div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
              <CommandSeparator alwaysRender />
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <div className="relative -mb-24 mt-3 h-24 overflow-y-auto">
        {selectedValues.map(({ label, value, color }) => (
          <Badge
            key={value}
            style={badgeStyle(color)}
            className="mb-2 mr-2"
          >
            {label}
          </Badge>
        ))}
      </div>
    </div>
  );
}
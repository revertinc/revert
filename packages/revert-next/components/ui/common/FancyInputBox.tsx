'use client';

import * as React from 'react';
import {
    Button,
    Badge,
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Separator,
} from '@revertdotdev/components';
import { cn, cva, VariantProps } from '@revertdotdev/utils';
import { Icons } from '@revertdotdev/icons';

/**
 * Variants for the multi-select component to handle different styles.
 * Uses class-variance-authority (cva) to define different styles based on "variant" prop.
 */
const multiSelectVariants = cva(
    'm-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300',
    {
        variants: {
            variant: {
                default: 'border-gray-25 text-gray-50 font-normal bg-card hover:bg-card/80',
                secondary: 'border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80',
                destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
                inverted: 'inverted',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

/**
 * Props for MultiSelect component
 */
interface MultiSelectProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof multiSelectVariants> {
    /**
     * An array of option objects to be displayed in the multi-select component.
     * Each option object has a label, value, and an optional icon.
     */
    options: {
        /** The text to display for the option. */
        label: string;
        /** The unique value associated with the option. */
        value: string;
        /** Optional icon component to display alongside the option. */
        icon?: React.ComponentType<{ className?: string }>;
    }[];

    /**
     * Callback function triggered when the selected values change.
     * Receives an array of the new selected values.
     */
    onValueChange: (value: string[]) => void;

    /** The default selected values when the component mounts. */
    defaultValue: string[];

    /**
     * Placeholder text to be displayed when no values are selected.
     * Optional, defaults to "Select options".
     */
    placeholder?: string;

    /**
     * Animation duration in seconds for the visual effects (e.g., bouncing badges).
     * Optional, defaults to 0 (no animation).
     */
    animation?: number;

    /**
     * Maximum number of items to display. Extra selected items will be summarized.
     * Optional, defaults to 3.
     */
    maxCount?: number;

    /**
     * The modality of the popover. When set to true, interaction with outside elements
     * will be disabled and only popover content will be visible to screen readers.
     * Optional, defaults to false.
     */
    modalPopover?: boolean;

    /**
     * If true, renders the multi-select component as a child of another component.
     * Optional, defaults to false.
     */
    asChild?: boolean;

    /**
     * Additional class names to apply custom styles to the multi-select component.
     * Optional, can be used to add custom styles.
     */
    className?: string;
}

export const FancyInputBox = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
    (
        {
            options,
            onValueChange,
            variant,
            defaultValue = [],
            placeholder = 'Select Scopes here..',
            animation = 0,
            maxCount = 10,
            modalPopover = false,
            asChild = false,
            className,
            ...props
        },
        ref
    ) => {
        const [selectedValues, setSelectedValues] = React.useState<string[]>(defaultValue);
        const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

        React.useEffect(() => {
            if (JSON.stringify(selectedValues) !== JSON.stringify(defaultValue)) {
                setSelectedValues(selectedValues);
            }
        }, [defaultValue, selectedValues]);

        const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
                setIsPopoverOpen(true);
            } else if (event.key === 'Backspace' && !event.currentTarget.value) {
                const newSelectedValues = [...selectedValues];
                newSelectedValues.pop();
                setSelectedValues(newSelectedValues);
                onValueChange(newSelectedValues);
            }
        };

        const toggleOption = (value: string) => {
            const newSelectedValues = selectedValues.includes(value)
                ? selectedValues.filter((v) => v !== value)
                : [...selectedValues, value];
            setSelectedValues(newSelectedValues);
            onValueChange(newSelectedValues);
        };

        const handleClear = () => {
            setSelectedValues([]);
            onValueChange([]);
        };

        const handleTogglePopover = () => {
            setIsPopoverOpen((prev) => !prev);
        };

        const clearExtraOptions = () => {
            const newSelectedValues = selectedValues.slice(0, maxCount);
            setSelectedValues(newSelectedValues);
            onValueChange(newSelectedValues);
        };

        const toggleAll = () => {
            if (selectedValues.length === options.length) {
                handleClear();
            } else {
                const allValues = options.map((option) => option.value);
                setSelectedValues(allValues);
                onValueChange(allValues);
            }
        };

        return (
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen} modal={modalPopover}>
                <PopoverTrigger asChild>
                    <div>
                        <Button
                            ref={ref}
                            {...props}
                            onClick={handleTogglePopover}
                            className={cn(
                                'flex w-full p-1 rounded-md border border-gray-25 min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit hover:bg-inherit hover:border-gray-50/70 mb-2',
                                className
                            )}
                        >
                            {selectedValues.length > 0 ? (
                                <div className="flex justify-between items-center w-full">
                                    <div>
                                        <span className="text-sm text-gray-50/70 mx-3">{placeholder}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Icons.cross
                                            className="h-4 mx-2 cursor-pointer text-muted-foreground"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                handleClear();
                                            }}
                                        />
                                        <Separator orientation="vertical" className="flex min-h-6 h-full" />
                                        <Icons.chevrondown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between w-full mx-auto">
                                    <span className="text-sm font-normal text-gray-50/70 mx-3">{placeholder}</span>
                                    <Icons.chevrondown className="h-4 cursor-pointer text-muted-foreground mx-2" />
                                </div>
                            )}
                        </Button>
                        <div className="flex flex-wrap items-center">
                            {selectedValues.slice(0, maxCount).map((value) => {
                                const option = options.find((o) => o.value === value);
                                const IconComponent = option?.icon;
                                return (
                                    <Badge
                                        key={value}
                                        className={cn(
                                            'animate-bounce rounded-xl border border-gray-25',
                                            multiSelectVariants({ variant })
                                        )}
                                        style={{ animationDuration: `${animation}s` }}
                                    >
                                        {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                                        {option?.label}
                                        <Icons.xcircle
                                            className="ml-2 h-4 w-4 cursor-pointer"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                toggleOption(value);
                                            }}
                                        />
                                    </Badge>
                                );
                            })}
                            {selectedValues.length > maxCount && (
                                <Badge
                                    className={cn(
                                        'animate-bounce rounded-xl border border-gray-25',
                                        multiSelectVariants({ variant })
                                    )}
                                    style={{ animationDuration: `${animation}s` }}
                                >
                                    {`+ ${selectedValues.length - maxCount} more`}
                                </Badge>
                            )}
                        </div>
                    </div>
                </PopoverTrigger>
                <PopoverContent
                    className="w-96 p-0 border border-gray-50/70"
                    align="start"
                    onEscapeKeyDown={() => setIsPopoverOpen(false)}
                >
                    <Command>
                        <CommandInput placeholder="Search..." onKeyDown={handleInputKeyDown} />
                        <CommandList>
                            <CommandEmpty>No scopes found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem key="all" onSelect={toggleAll} className="cursor-pointer">
                                    <div
                                        className={cn(
                                            'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                            selectedValues.length === options.length
                                                ? 'bg-primary text-primary-foreground'
                                                : 'opacity-50 [&_svg]:invisible'
                                        )}
                                    >
                                        <Icons.check className="h-4 w-4" />
                                    </div>
                                    <span>Select All</span>
                                </CommandItem>
                                {options.map((option) => {
                                    const isSelected = selectedValues.includes(option.value);
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() => toggleOption(option.value)}
                                            className="cursor-pointer"
                                        >
                                            <div
                                                className={cn(
                                                    'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                                                    isSelected
                                                        ? 'bg-primary text-primary-foreground'
                                                        : 'opacity-50 [&_svg]:invisible'
                                                )}
                                            >
                                                <Icons.check className="h-4 w-4" />
                                            </div>
                                            {option.icon && (
                                                <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span>{option.label}</span>
                                        </CommandItem>
                                    );
                                })}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup>
                                <div className="flex items-center justify-between">
                                    {selectedValues.length > 0 && (
                                        <>
                                            <CommandItem
                                                onSelect={handleClear}
                                                className="flex-1 justify-center cursor-pointer"
                                            >
                                                Clear
                                            </CommandItem>
                                            <Separator orientation="vertical" className="flex min-h-6 h-full" />
                                        </>
                                    )}
                                    <CommandSeparator />
                                    <CommandItem
                                        onSelect={() => setIsPopoverOpen(false)}
                                        className="flex-1 justify-center cursor-pointer"
                                    >
                                        Close
                                    </CommandItem>
                                </div>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        );
    }
);

FancyInputBox.displayName = 'FancyInputBox';

'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface Model {
    id: string;
    name: string;
    context_length?: number;
    pricing?: {
        prompt: string;
        completion: string;
    };
}

interface ModelSelectorProps {
    selectedModel: string;
    onModelChange: (model: string) => void;
    className?: string;
}

export function ModelSelector({ selectedModel, onModelChange, className }: ModelSelectorProps) {
    const [open, setOpen] = React.useState(false);
    const [openRouterKey] = useLocalStorage<string>('hyper-openrouter-key', '');
    const [models, setModels] = React.useState<Model[]>([]);
    const [loading, setLoading] = React.useState(false);

    // Only fetch once when key is available
    React.useEffect(() => {
        async function fetchModels() {
            if (!openRouterKey) return;

            setLoading(true);
            try {
                const res = await fetch('https://openrouter.ai/api/v1/models', {
                    headers: {
                        Authorization: `Bearer ${openRouterKey}`,
                    },
                });

                if (!res.ok) throw new Error('Failed to fetch models');

                const data = await res.json();
                // OpenRouter returns { data: [...] }
                const sortedModels = (data.data || []).sort((a: Model, b: Model) =>
                    a.name.localeCompare(b.name)
                );
                setModels(sortedModels);
            } catch (err) {
                console.error('Failed to fetch OpenRouter models:', err);
            } finally {
                setLoading(false);
            }
        }

        if (openRouterKey) {
            fetchModels();
        }
    }, [openRouterKey]);

    if (!openRouterKey) {
        return null;
    }

    // Find selected model name for display
    const selectedModelName = models.find((m) => m.id === selectedModel)?.name || selectedModel;
    const isDefault = selectedModel === 'hyper-default';
    const displayLabel = isDefault ? 'Modèle par défaut' : selectedModelName;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-[200px] justify-between text-xs h-8", className)}
                >
                    <span className="truncate">{displayLabel}</span>
                    {loading ? (
                        <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
                    ) : (
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Rechercher un modèle..." />
                    <CommandList>
                        <CommandEmpty>Aucun modèle trouvé.</CommandEmpty>
                        <CommandGroup heading="OpenRouter Models">
                            {/* Always offer Default option */}
                            <CommandItem
                                value="hyper-default"
                                onSelect={() => {
                                    onModelChange('hyper-default');
                                    setOpen(false);
                                }}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedModel === 'hyper-default' ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                Modèle par défaut
                            </CommandItem>

                            {models.map((model) => (
                                <CommandItem
                                    key={model.id}
                                    value={model.id} // value is used for filtering by cmdk. It searches this string.
                                    keywords={[model.name, model.id]} // Add keywords for better search
                                    onSelect={(currentValue) => {
                                        // cmdk lowercases the value, so we must use the model.id from closure
                                        onModelChange(model.id);
                                        setOpen(false);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedModel === model.id ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{model.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{model.id}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

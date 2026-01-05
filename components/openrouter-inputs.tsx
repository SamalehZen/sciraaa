
import { Input } from "@/components/ui/input";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useEffect, useState } from "react";

export function OpenRouterKeyInput() {
    const [apiKey, setApiKey] = useLocalStorage<string>('hyper-openrouter-key', '');
    const [value, setValue] = useState(apiKey);

    useEffect(() => {
        setValue(apiKey);
    }, [apiKey]);

    return (
        <Input
            id="openrouter-key"
            type="password"
            placeholder="sk-or-v1-..."
            value={value}
            onChange={(e) => {
                setValue(e.target.value);
                setApiKey(e.target.value);
            }}
            className="mt-1.5"
        />
    );
}

export function OpenRouterUrlInput() {
    const [url, setUrl] = useLocalStorage<string>('hyper-openrouter-url', '');
    const [value, setValue] = useState(url);

    useEffect(() => {
        setValue(url);
    }, [url]);

    return (
        <Input
            id="openrouter-url"
            type="text"
            placeholder="https://openrouter.ai/api/v1"
            value={value}
            onChange={(e) => {
                setValue(e.target.value);
                setUrl(e.target.value);
            }}
            className="mt-1.5"
        />
    );
}

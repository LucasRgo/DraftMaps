import { useEffect, useState } from "react";

import { fetchLocationById } from "../services/locationsApi";
import type { Location } from "../types/location";

export function useLocation(id: string) {
    const [data, setData] = useState<Location | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        setData(null);

        const trimmedId = id.trim();
        if (trimmedId.length === 0) {
            setError("Location id is required");
            setIsLoading(false);
            return;
        }

        fetchLocationById(trimmedId)
            .then((location) => {
                setData(location);
            })
            .catch((err) => {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load location",
                );
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [id, retryCount]);

    return {
        data,
        error,
        isLoading,
        reload() {
            setRetryCount((c) => c + 1);
        },
    };
}

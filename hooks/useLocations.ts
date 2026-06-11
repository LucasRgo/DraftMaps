import { useEffect, useState } from "react";

import { fetchLocations } from "../services/locationsApi";
import type { Location } from "../types/location";

export function useLocations() {
    const [data, setData] = useState<Location[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        fetchLocations()
            .then((locations) => {
                setData(locations);
            })
            .catch((err) => {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load locations",
                );
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [retryCount]);

    return {
        data,
        error,
        isLoading,
        reload() {
            setRetryCount((c) => c + 1);
        },
    };
}

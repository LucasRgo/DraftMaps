import { useEffect, useRef, useState } from "react";

import { fetchLocationById } from "../services/locationsApi";
import type { Location } from "../types/location";

type UseLocationResult = {
    data: Location | null;
    error: string | null;
    isLoading: boolean;
    reload: () => void;
};

export function useLocation(id: string): UseLocationResult {
    const [data, setData] = useState<Location | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadVersion, setReloadVersion] = useState(0);
    const requestIdRef = useRef(0);

    useEffect(() => {
        let isActive = true;
        const trimmedId = id.trim();
        const requestId = requestIdRef.current + 1;

        requestIdRef.current = requestId;
        setIsLoading(true);
        setError(null);

        if (trimmedId.length === 0) {
            setData(null);
            setError("Location id is required");
            setIsLoading(false);

            return () => {
                isActive = false;
            };
        }

        void fetchLocationById(trimmedId)
            .then((location) => {
                if (!isActive || requestId !== requestIdRef.current) {
                    return;
                }

                setData(location);
                setIsLoading(false);
            })
            .catch((caughtError: unknown) => {
                if (!isActive || requestId !== requestIdRef.current) {
                    return;
                }

                const message =
                    caughtError instanceof Error
                        ? caughtError.message
                        : "Unable to load location";

                setData(null);
                setError(message);
                setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [id, reloadVersion]);

    return {
        data,
        error,
        isLoading,
        reload() {
            setReloadVersion((currentVersion) => currentVersion + 1);
        },
    };
}

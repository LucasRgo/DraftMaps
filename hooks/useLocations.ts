import { useEffect, useRef, useState } from "react";

import { fetchLocations } from "../services/locationsApi";
import type { Location } from "../types/location";

type UseLocationsResult = {
    data: Location[];
    error: string | null;
    isLoading: boolean;
    reload: () => void;
};

export function useLocations(): UseLocationsResult {
    const [data, setData] = useState<Location[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [reloadVersion, setReloadVersion] = useState(0);
    const requestIdRef = useRef(0);

    useEffect(() => {
        let isActive = true;
        const requestId = requestIdRef.current + 1;

        requestIdRef.current = requestId;
        setIsLoading(true);
        setError(null);

        void fetchLocations()
            .then((locations) => {
                if (!isActive || requestId !== requestIdRef.current) {
                    return;
                }

                setData(locations);
                setIsLoading(false);
            })
            .catch((caughtError: unknown) => {
                if (!isActive || requestId !== requestIdRef.current) {
                    return;
                }

                const message =
                    caughtError instanceof Error
                        ? caughtError.message
                        : "Unable to load locations";

                setError(message);
                setIsLoading(false);
            });

        return () => {
            isActive = false;
        };
    }, [reloadVersion]);

    return {
        data,
        error,
        isLoading,
        reload() {
            setReloadVersion((currentVersion) => currentVersion + 1);
        },
    };
}

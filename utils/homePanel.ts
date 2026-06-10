export function getLocationsPanelSummary(
    totalLocations: number,
    selectedLocationName: string | null,
): string {
    const totalLabel = `${totalLocations} spot${totalLocations === 1 ? "" : "s"} mapped.`;
    const trimmedName = selectedLocationName?.trim();

    if (trimmedName) {
        return `${totalLabel} Selected: ${trimmedName}.`;
    }

    return `${totalLabel} Browse the calmest picks.`;
}

export function getLocationsPanelToggleLabel(isOpen: boolean): string {
    return isOpen ? "Hide list" : "Show list";
}

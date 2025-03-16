export function getScopeLabel(scope: string): string {
    switch (scope) {
        case "hba":
            return "HBA";
        case "smc_b":
            return "SMC-B";
        case "egk":
            return "eGK";
        case "cv_root":
            return "CVC-Root";
        case "cv":
            return "CVC";
        case "comp":
            return "Komponenten";
        case "bnetza":
            return "BNetzA";
        default:
            return scope;
    }
}

export function getScopeColor(scope: string): "black" | "green" | "blue" | "magenta" | "outline" | "red" | undefined {
    switch (scope) {
        case "hba":
            return "blue";
        case "smc_b":
            return "green";
        case "egk":
            return "magenta";
        case "bnetza":
            return "black";
        default:
            return "outline";
    }
}
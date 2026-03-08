import React, { createContext, useContext } from "react";
import type { Configuration } from "@/main.tsx";

const ConfigurationContext = createContext<Configuration | undefined>(undefined);

export function ConfigurationProvider({ configuration, children }: { configuration: Configuration; children: React.ReactNode }) {
    return <ConfigurationContext.Provider value={configuration}>{children}</ConfigurationContext.Provider>;
}

export function useConfiguration() {
    const config = useContext(ConfigurationContext);
    if (!config) throw new Error("No Configuration set, use ConfigurationProvider to set one");
    return config;
}

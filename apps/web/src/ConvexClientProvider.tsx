import * as React from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
    return (
        <ConvexProvider client={convex}>
            {children}
        </ConvexProvider>
    );
}

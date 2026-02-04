import { create } from 'zustand';
import { persist } from 'zustand/middleware';


export interface AppState {
    userId: string;
    currentSymbol: string;
    configId: string | null;
    isRunning: boolean;
    isLoading: boolean;
    // Actions
    setSymbol: (symbol: string) => void;
    setConfig: (configId: string | null, isRunning: boolean) => void;
    setIsRunning: (isRunning: boolean) => void;
    setIsLoading: (isLoading: boolean) => void;
}

const INITIAL_STATE = {
    userId: 'default',
    currentSymbol: 'HYPE',
    configId: null,
    isRunning: false,
    isLoading: true,
};

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            ...INITIAL_STATE,
            setSymbol: (currentSymbol) => set({ currentSymbol }),
            setConfig: (configId, isRunning) => set({ configId, isRunning, isLoading: false }),
            setIsRunning: (isRunning) => set({ isRunning }),
            setIsLoading: (isLoading) => set({ isLoading }),
        }),
        {
            name: 'wick-hunter-storage',
            partialize: (state) => ({
                userId: state.userId,
                currentSymbol: state.currentSymbol
            }), // Only persist user preferences
        }
    )
);

// Helper selector for easier access if needed
export const AppActions = {
    setSymbol: (symbol: string) => useAppStore.getState().setSymbol(symbol),
    setConfig: (configId: string | null, isRunning: boolean) => useAppStore.getState().setConfig(configId, isRunning),
    setIsRunning: (isRunning: boolean) => useAppStore.getState().setIsRunning(isRunning),
};

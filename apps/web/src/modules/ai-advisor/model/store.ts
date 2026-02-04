import { create } from 'zustand';
import type { AIMessage } from '../lib/types';

interface AIAdvisorState {
    messages: AIMessage[];
    isLoading: boolean;
    lastApplyTimestamp: number | null;
}

export const useAIAdvisorStore = create<AIAdvisorState>(() => ({
    messages: [],
    isLoading: false,
    lastApplyTimestamp: null,
}));

export const AIAdvisorActions = {
    addMessage: (message: AIMessage) => {
        useAIAdvisorStore.setState(state => ({
            messages: [...state.messages, message]
        }));
    },

    updateLastMessage: (updates: Partial<AIMessage>) => {
        useAIAdvisorStore.setState(state => ({
            messages: state.messages.map((msg, idx) => 
                idx === state.messages.length - 1 
                    ? { ...msg, ...updates }
                    : msg
            )
        }));
    },

    setLoading: (isLoading: boolean) => {
        useAIAdvisorStore.setState({ isLoading });
    },

    markApplied: () => {
        useAIAdvisorStore.setState({ lastApplyTimestamp: Date.now() });
    },

    clearMessages: () => {
        useAIAdvisorStore.setState({ messages: [] });
    },
};

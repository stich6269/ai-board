import { ClerkProvider, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import type { ReactNode } from 'react';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    if (!PUBLISHABLE_KEY) {
        return <>{children}</>;
    }

    return (
        <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
            {children}
        </ClerkProvider>
    );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
    if (!PUBLISHABLE_KEY) {
        return <>{children}</>;
    }

    return (
        <>
            <SignedIn>{children}</SignedIn>
            <SignedOut>
                <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                    <div className="text-center space-y-6">
                        <h1 className="text-3xl font-bold text-white">Wick Hunter</h1>
                        <p className="text-gray-400">Sign in to access the dashboard</p>
                        <SignInButton mode="modal">
                            <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                                Sign In
                            </button>
                        </SignInButton>
                    </div>
                </div>
            </SignedOut>
        </>
    );
}

export { UserButton };

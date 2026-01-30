import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { walletFormSchema, type WalletFormValues } from "@funding-harvester/shared/settings-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, AlertTriangle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AddKeyForm() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState<{ walletAddress: string; usdcBalance: number } | null>(null);

    const form = useForm<WalletFormValues>({
        resolver: zodResolver(walletFormSchema),
        defaultValues: {
            label: "",
            privateKey: "",
        },
    });

    async function onSubmit(values: WalletFormValues) {
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch(`${API_URL}/api/keys/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(values),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                form.reset();
                setSuccess({
                    walletAddress: data.walletAddress,
                    usdcBalance: data.usdcBalance,
                });
            } else {
                setError(data.error || "Validation failed");
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <div>
                        <p className="font-semibold">Security Warning</p>
                        <p className="mt-1">Use a dedicated trading wallet, NOT your main savings wallet. Your private key is stored encrypted in the database.</p>
                    </div>
                </div>

                <FormField
                    control={form.control}
                    name="label"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Wallet Label</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g. Hyperliquid Trading" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="privateKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Private Key</FormLabel>
                            <FormControl>
                                <Input placeholder="0x..." type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {error && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-xs font-medium">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-3 bg-green-50 border border-green-100 rounded-xl text-green-600 text-xs font-medium">
                        <p>Wallet connected successfully!</p>
                        <p className="mt-1 font-mono text-[10px]">{success.walletAddress}</p>
                        <p className="mt-1">USDC Balance: ${success.usdcBalance.toFixed(2)}</p>
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Connecting to Hyperliquid..." : "Connect Wallet"}
                </Button>
            </form>
        </Form>
    );
}

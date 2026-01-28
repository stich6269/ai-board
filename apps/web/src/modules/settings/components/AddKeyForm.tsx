import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { exchangeFormSchema, type ExchangeFormValues } from "@funding-harvester/shared/settings-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function AddKeyForm() {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [success, setSuccess] = React.useState(false);

    const form = useForm<ExchangeFormValues>({
        resolver: zodResolver(exchangeFormSchema),
        defaultValues: {
            exchangeId: "bybit",
            label: "",
            apiKey: "",
            secretKey: "",
        },
    });

    async function onSubmit(values: ExchangeFormValues) {
        setIsLoading(true);
        setError(null);
        setSuccess(false);
        try {
            // Call backend API for validation
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
                setSuccess(true);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="exchangeId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Exchange</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select exchange" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="bybit">Bybit</SelectItem>
                                        <SelectItem value="gateio">Gate.io</SelectItem>
                                        <SelectItem value="binance">Binance</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="label"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Label</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g. Main Account" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>API Key</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter API Key" type="password" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="secretKey"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Secret Key</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter Secret Key" type="password" {...field} />
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
                        Exchange connected successfully!
                    </div>
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? "Verifying..." : "Verify & Save"}
                </Button>
            </form>
        </Form>
    );
}

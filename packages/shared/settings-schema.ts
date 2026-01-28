import { z } from "zod";

export const exchangeFormSchema = z.object({
    exchangeId: z.enum(["bybit", "gateio", "binance"], {
        required_error: "Please select an exchange.",
    }),
    label: z.string().min(2, "Label must be at least 2 characters."),
    apiKey: z.string().min(10, "API Key looks too short."),
    secretKey: z.string().min(10, "Secret Key looks too short."),
});

export type ExchangeFormValues = z.infer<typeof exchangeFormSchema>;

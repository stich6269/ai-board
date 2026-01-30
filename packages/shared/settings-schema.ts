import { z } from "zod";

const ETH_PRIVATE_KEY_REGEX = /^0x[a-fA-F0-9]{64}$/;
const ETH_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;

export const walletFormSchema = z.object({
    label: z.string().min(2, "Label must be at least 2 characters."),
    privateKey: z
        .string()
        .regex(ETH_PRIVATE_KEY_REGEX, "Invalid private key format. Must be 0x followed by 64 hex characters."),
    walletAddress: z
        .string()
        .regex(ETH_ADDRESS_REGEX, "Invalid wallet address format. Must be 0x followed by 40 hex characters.")
        .optional(),
});

export type WalletFormValues = z.infer<typeof walletFormSchema>;

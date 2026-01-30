import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldCheck, ShieldAlert, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function KeysList() {
    const wallets = useQuery(api.keys.listWallets);
    const balance = useQuery(api.liquidity.getWalletBalance, { exchangeId: "hyperliquid" });
    const removeKey = useMutation(api.keys.removeKey);
    const [confirmingId, setConfirmingId] = React.useState<string | null>(null);

    if (wallets === undefined) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-12 w-full animate-pulse bg-muted rounded-md" />
                ))}
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>USDC Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {wallets.map((wallet: any) => (
                    <TableRow key={wallet._id}>
                        <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-2">
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                                {wallet.walletAddress.slice(0, 6)}...{wallet.walletAddress.slice(-4)}
                            </div>
                        </TableCell>
                        <TableCell>{wallet.label}</TableCell>
                        <TableCell>
                            {wallet.isValid ? (
                                <Badge variant="outline" className="text-green-600 gap-1 rounded-xl">
                                    <ShieldCheck className="h-3 w-3" /> Connected
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="gap-1 rounded-xl">
                                    <ShieldAlert className="h-3 w-3" /> Invalid
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-xs">
                            ${balance?.totalUsdt?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell className="text-right">
                            {confirmingId === wallet._id ? (
                                <div className="flex items-center justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 text-[11px] font-bold text-muted-foreground"
                                        onClick={() => setConfirmingId(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="h-8 text-[11px] font-bold rounded-xl"
                                        onClick={async () => {
                                            await removeKey({ id: wallet._id });
                                            setConfirmingId(null);
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive group transition-colors"
                                    onClick={() => setConfirmingId(wallet._id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
                {wallets.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm font-medium">
                            No wallets connected yet. Add your Hyperliquid wallet to get started.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

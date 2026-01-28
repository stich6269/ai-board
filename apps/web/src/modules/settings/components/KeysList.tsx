import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function KeysList() {
    const keys = useQuery(api.keys.listKeys);
    const removeKey = useMutation(api.keys.removeKey);
    const [confirmingId, setConfirmingId] = React.useState<string | null>(null);

    if (keys === undefined) {
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
                    <TableHead>Exchange</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {keys.map((key: any) => (
                    <TableRow key={key._id}>
                        <TableCell className="font-medium capitalize">{key.exchangeId}</TableCell>
                        <TableCell>{key.label}</TableCell>
                        <TableCell>
                            {key.isValid ? (
                                <Badge variant="outline" className="text-green-600 gap-1 rounded-xl">
                                    <ShieldCheck className="h-3 w-3" /> Valid
                                </Badge>
                            ) : (
                                <Badge variant="destructive" className="gap-1 rounded-xl">
                                    <ShieldAlert className="h-3 w-3" /> Invalid
                                </Badge>
                            )}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-xs">
                            {key.apiKey.substring(0, 4)}...{key.apiKey.slice(-4)}
                        </TableCell>
                        <TableCell className="text-right">
                            {confirmingId === key._id ? (
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
                                            await removeKey({ id: key._id });
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
                                    onClick={() => setConfirmingId(key._id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </TableCell>
                    </TableRow>
                ))}
                {keys.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-12 text-sm font-medium">
                            No API keys connected yet.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );
}

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AddKeyForm } from "@/modules/settings/components/AddKeyForm";
import { KeysList } from "@/modules/settings/components/KeysList";

export default function SettingsPage() {
    return (
        <div className="p-8 space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your exchange connections and application preferences.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-5">
                    <Card>
                        <CardHeader>
                            <CardTitle>Add API Key</CardTitle>
                            <CardDescription>
                                Connect a new exchange account to start scanning for funding opportunities.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AddKeyForm />
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-7">
                    <Card>
                        <CardHeader>
                            <CardTitle>Connected Exchanges</CardTitle>
                            <CardDescription>
                                View and manage your currently connected exchange credentials.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <KeysList />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

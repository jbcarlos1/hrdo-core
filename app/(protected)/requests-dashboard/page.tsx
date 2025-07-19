"use client";
import { useSession } from "next-auth/react";
import RequestsDashboard from "@/components/crud/requests-dashboard";

export default function RequestsPage() {
    const { data: session } = useSession();
    const role = session?.user?.role;

    if (!role) {
        return null;
    }

    return (
        <div className="h-full flex">
            <RequestsDashboard />
        </div>
    );
}

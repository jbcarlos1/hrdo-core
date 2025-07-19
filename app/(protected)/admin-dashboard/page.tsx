"use client";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AdminDashboard from "@/components/crud/admin-dashboard";
import { useEffect } from "react";
import UnauthorizedAccess from "../_components/unauthorizedAccess";

export default function AdminPage() {
    const router = useRouter();
    const { data: session } = useSession();
    const role = session?.user?.role;

    useEffect(() => {
        if (role === "USER") {
            router.push("/supply-out-dashboard");
        } else if (role === "APPROVER") {
            router.push("/requests-dashboard");
        }
    }, [role, router]);

    if (!role) {
        return null;
    }

    return (
        <div className="h-full flex">
            {role === "ADMIN" ? <AdminDashboard /> : <UnauthorizedAccess />}
        </div>
    );
}

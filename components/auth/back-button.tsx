"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BackButtonProps {
    label: string;
    href: string;
    isPending?: boolean;
}

export const BackButton = ({ label, href, isPending }: BackButtonProps) => {
    return (
        <Button
            disabled={isPending}
            variant="link"
            className="font-normal w-full"
            size="sm"
            asChild
        >
            {isPending ? <p className="opacity-50">{label}</p> : <Link href={href}>{label}</Link>}
        </Button>
    );
};

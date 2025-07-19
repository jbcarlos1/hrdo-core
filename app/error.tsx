"use client";

import { useEffect } from "react";

export default function Error({
    error,
}: {
    error: Error & { digest?: string };
}) {
    useEffect(() => {
        window.location.reload();
    }, [error]);

    return null;
}

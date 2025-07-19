"use client";

import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";

interface SocialProps {
    isPending?: boolean;
}

export const Social = ({ isPending }: SocialProps) => {
    const onClick = (provider: "google" | "github") => {
        signIn(provider, {
            callbackUrl: "/pending-approval",
        });
    };

    return (
        <div className="flex items-center w-full gap-x-2">
            <Button
                disabled={isPending}
                size="lg"
                className="w-full"
                variant="outline"
                onClick={() => onClick("google")}
            >
                <FcGoogle className="h-5 w-5" />
            </Button>
        </div>
    );
};

"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Header } from "@/components/crud/header";

interface CardWrapperProps {
    children: React.ReactNode;
    headerLabel: string;
}

export const CardWrapper = ({ children, headerLabel }: CardWrapperProps) => {
    return (
        <Card className="w-[400px] shadow-md">
            <CardHeader>
                <Header header="HRDO Supply Hub" label={headerLabel} />
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    );
};

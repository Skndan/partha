import type { ReactNode } from "react";

interface HeadingProps {
    title: string;
    description: string;
    action?: ReactNode;
}

export function Heading({ title, description, action }: HeadingProps) {
    return (
        <div>
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
                {action}
            </div>
            <p className="text-muted-foreground">{description}</p>
        </div>
    );
}

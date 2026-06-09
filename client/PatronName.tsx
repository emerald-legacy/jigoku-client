import { usePatronStatus } from "./patronStatus";

interface PatronNameProps {
    name?: string | null;
    className?: string;
}

export function PatronName({ name, className }: PatronNameProps) {
    const isPatron = usePatronStatus(name);
    const classes = `${className ?? ""}${isPatron ? " patron-name" : ""}`.trim();
    return <span className={ classes || undefined }>{ name }</span>;
}

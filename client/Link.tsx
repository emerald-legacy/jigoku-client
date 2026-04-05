import { connect } from "react-redux";
import * as actions from "./actions";
import type { ReactNode } from "react";

interface InnerLinkProps {
    children?: ReactNode;
    className?: string;
    href: string;
    navigate: (path: string) => void;
}

function InnerLink({ children, className, href, navigate }: InnerLinkProps) {
    const onClick = (event: React.MouseEvent) => {
        event.preventDefault();
        navigate(href);
    };

    return (
        <a className={ className } href={ href } onClick={ onClick }>
            { children }
        </a>
    );
}

InnerLink.displayName = "Link";

const mapStateToProps = (_state: any, ownProps: { href: string }) => {
    return {
        href: ownProps.href
    };
};

const Link = connect(mapStateToProps, actions)(InnerLink);

export default Link;

import { connect } from 'react-redux';
import * as actions from './actions';

function InnerLink({ children, className, href, navigate }) {
    const onClick = (event) => {
        event.preventDefault();
        navigate(href);
    };

    return (
        <a className={ className } href={ href } onClick={ onClick }>
            { children }
        </a>
    );
}

InnerLink.displayName = 'Link';

const mapStateToProps = (state, ownProps) => {
    return {
        href: ownProps.href
    };
};

const Link = connect(mapStateToProps, actions)(InnerLink);

export default Link;

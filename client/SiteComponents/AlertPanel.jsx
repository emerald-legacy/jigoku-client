import PropTypes from 'prop-types';

function AlertPanel({ children, message, noIcon, title, type }) {
    let icon = 'glyphicon';
    let alertClass = 'alert fade in';

    switch(type) {
        case 'warning':
            icon += ' glyphicon-warning-sign';
            alertClass += ' alert-warning';
            break;
        case 'error':
            icon += ' glyphicon-exclamation-sign';
            alertClass += ' alert-danger';
            break;
        case 'info':
            icon += ' glyphicon-info-sign';
            alertClass += ' alert-info';
            break;
        case 'success':
            icon += ' glyphicon-ok-sign';
            alertClass += ' alert-success';
            break;
    }

    return (
        <div className={ alertClass } role='alert'>
            { noIcon ? null : <span className={ icon } aria-hidden='true' /> }
            { title ? <span className='sr-only'>{ title }</span> : null }
            &nbsp;{ message }
            &nbsp;{ children }
        </div>
    );
}

AlertPanel.displayName = 'AlertPanel';
AlertPanel.propTypes = {
    children: PropTypes.any,
    message: PropTypes.string,
    noIcon: PropTypes.bool,
    title: PropTypes.string,
    type: PropTypes.oneOf(['warning', 'info', 'success', 'error'])
};

export default AlertPanel;

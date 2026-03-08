import PropTypes from 'prop-types';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';

const typeConfig = {
    warning: { Icon: AlertTriangle, alertClass: 'alert alert-warning' },
    error: { Icon: AlertCircle, alertClass: 'alert alert-danger' },
    info: { Icon: Info, alertClass: 'alert alert-info' },
    success: { Icon: CheckCircle, alertClass: 'alert alert-success' }
};

function AlertPanel({ children, message, noIcon, title, type }) {
    const config = typeConfig[type] || {};
    const IconComponent = config.Icon;

    return (
        <div className={ config.alertClass || 'alert' } role='alert'>
            { noIcon || !IconComponent ? null : <IconComponent size={ 16 } aria-hidden='true' style={ { display: 'inline', verticalAlign: 'text-bottom' } } /> }
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

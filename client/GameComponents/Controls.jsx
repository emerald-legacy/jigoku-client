import PropTypes from 'prop-types';

function Controls({
    manualModeEnabled,
    onManualModeClick,
    onSettingsClick,
    onToggleChatClick,
    showChatAlert,
    showManualMode
}) {
    const laptopSize = window.innerWidth <= 1366;

    return (
        <div className='controls panel'>
            <button
                className={'btn btn-transparent' + (showChatAlert ? ' with-alert' : '')}
                onClick={onToggleChatClick}
            >
                <span className='glyphicon glyphicon-menu-hamburger' />
                {laptopSize ? '' : ' Toggle Chat'}
                <i className='glyphicon glyphicon-exclamation-sign' />
            </button>
            {showManualMode && (
                <button
                    className={'btn btn-transparent ' + (manualModeEnabled ? 'manual' : 'auto')}
                    onClick={onManualModeClick}
                >
                    <span className='glyphicon glyphicon-wrench' />
                    {laptopSize ? '' : ' Manual Mode ' + (manualModeEnabled ? ' Enabled' : 'Disabled')}
                </button>
            )}
            <button className='btn btn-transparent' onClick={onSettingsClick}>
                <span className='glyphicon glyphicon-cog' />
                {laptopSize ? '' : ' Settings'}
            </button>
        </div>
    );
}

Controls.displayName = 'Controls';
Controls.propTypes = {
    manualModeEnabled: PropTypes.bool,
    onManualModeClick: PropTypes.func,
    onSettingsClick: PropTypes.func,
    onToggleChatClick: PropTypes.func,
    showChatAlert: PropTypes.bool,
    showManualMode: PropTypes.bool
};

export default Controls;

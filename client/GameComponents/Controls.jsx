import PropTypes from 'prop-types';
import { Menu, AlertCircle, Wrench, Settings } from 'lucide-react';

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
                className={ 'btn btn-transparent' + (showChatAlert ? ' with-alert' : '') }
                onClick={ onToggleChatClick }
            >
                <Menu size={ 16 } />
                { laptopSize ? '' : ' Toggle Chat' }
                { showChatAlert && <AlertCircle size={ 16 } /> }
            </button>
            { showManualMode && (
                <button
                    className={ 'btn btn-transparent ' + (manualModeEnabled ? 'manual' : 'auto') }
                    onClick={ onManualModeClick }
                >
                    <Wrench size={ 16 } />
                    { laptopSize ? '' : ' Manual Mode ' + (manualModeEnabled ? ' Enabled' : 'Disabled') }
                </button>
            ) }
            <button className='btn btn-transparent' onClick={ onSettingsClick }>
                <Settings size={ 16 } />
                { laptopSize ? '' : ' Settings' }
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

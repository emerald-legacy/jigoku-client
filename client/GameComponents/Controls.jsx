import { Menu, AlertCircle, Wrench, Settings, Download } from 'lucide-react';

function Controls({
    manualModeEnabled,
    onDownloadLogClick,
    onManualModeClick,
    onSettingsClick,
    onToggleChatClick,
    showChatAlert,
    showDownloadLog,
    showManualMode
}) {
    const laptopSize = window.innerWidth <= 1366;

    return (
        <div className="controls panel">
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
            <button className="btn btn-transparent" onClick={ onSettingsClick }>
                <Settings size={ 16 } />
                { laptopSize ? '' : ' Settings' }
            </button>
            { showDownloadLog && (
                <button className="btn btn-transparent" onClick={ onDownloadLogClick }>
                    <Download size={ 16 } />
                    { laptopSize ? '' : ' Game Log' }
                </button>
            ) }
        </div>
    );
}

Controls.displayName = 'Controls';

export default Controls;

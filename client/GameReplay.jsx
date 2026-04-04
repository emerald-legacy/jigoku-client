import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { Upload, SkipBack, ChevronLeft, Play, Pause, ChevronRight, SkipForward } from 'lucide-react';
import { InnerGameBoard } from './GameBoard.jsx';
import { parseGameLog } from './GameComponents/gameLogSerializer.js';

const speeds = [
    { label: '0.5x', delay: 2000 },
    { label: '1x', delay: 1000 },
    { label: '2x', delay: 500 },
    { label: '4x', delay: 250 }
];

const noop = () => {};

function ReplayControls({ currentIndex, totalStates, isPlaying, speedIndex, onJumpToStart, onJumpToEnd, onStepBack, onStepForward, onTogglePlay, onSpeedChange, onReset }) {
    return (
        <div className='replay-bar'>
            <div className='replay-controls'>
                <button className='btn btn-transparent' onClick={ onJumpToStart } disabled={ currentIndex === 0 } title='Jump to start'>
                    <SkipBack size={ 14 } />
                </button>
                <button className='btn btn-transparent' onClick={ onStepBack } disabled={ currentIndex === 0 } title='Step back'>
                    <ChevronLeft size={ 14 } />
                </button>
                <button className='btn btn-transparent' onClick={ onTogglePlay } title={ isPlaying ? 'Pause' : 'Play' }>
                    { isPlaying ? <Pause size={ 14 } /> : <Play size={ 14 } /> }
                </button>
                <button className='btn btn-transparent' onClick={ onStepForward } disabled={ currentIndex >= totalStates - 1 } title='Step forward'>
                    <ChevronRight size={ 14 } />
                </button>
                <button className='btn btn-transparent' onClick={ onJumpToEnd } disabled={ currentIndex >= totalStates - 1 } title='Jump to end'>
                    <SkipForward size={ 14 } />
                </button>
                <div className='replay-speed'>
                    { speeds.map((s, i) => (
                        <button
                            key={ s.label }
                            className={ 'btn btn-transparent' + (i === speedIndex ? ' active' : '') }
                            onClick={ () => onSpeedChange(i) }
                        >
                            { s.label }
                        </button>
                    )) }
                </div>
                <span className='replay-progress'>
                    { currentIndex + 1 } / { totalStates }
                </span>
            </div>
            <div className='replay-actions'>
                <button className='btn btn-default btn-sm' onClick={ onReset }>Load File</button>
            </div>
        </div>
    );
}

ReplayControls.propTypes = {
    currentIndex: PropTypes.number,
    isPlaying: PropTypes.bool,
    onJumpToEnd: PropTypes.func,
    onJumpToStart: PropTypes.func,
    onReset: PropTypes.func,
    onSpeedChange: PropTypes.func,
    onStepBack: PropTypes.func,
    onStepForward: PropTypes.func,
    onTogglePlay: PropTypes.func,
    speedIndex: PropTypes.number,
    totalStates: PropTypes.number
};

function GameReplay() {
    const [logData, setLogData] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speedIndex, setSpeedIndex] = useState(1);
    const [cardToZoom, setCardToZoom] = useState(null);
    const [error, setError] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [portalTarget, setPortalTarget] = useState(null);

    const fileInputRef = useRef(null);
    const intervalRef = useRef(null);

    const totalStates = logData?.replayData?.length || 0;

    useEffect(() => {
        if(logData) {
            const el = document.querySelector('.replay-mode .right-side .controls');
            if(el) {
                setPortalTarget(el);
            }
        }
    }, [logData, currentIndex]);

    useEffect(() => {
        if(isPlaying && totalStates > 0) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prev) => {
                    if(prev >= totalStates - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, speeds[speedIndex].delay);
        }

        return () => {
            if(intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, speedIndex, totalStates]);

    const handleFile = useCallback((file) => {
        setError(null);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const log = parseGameLog(e.target.result);
                if(!log.replayData || log.replayData.length === 0) {
                    setError('This log file does not contain replay data. Only logs downloaded after a game with replay recording will work.');
                    return;
                }
                setLogData(log);
                setCurrentIndex(0);
                setIsPlaying(false);
            } catch(err) {
                setError('Failed to parse game log: ' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if(file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        setDragOver(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setDragOver(false);
    }, []);

    const handleFileInput = useCallback((e) => {
        const file = e.target.files[0];
        if(file) {
            handleFile(file);
        }
    }, [handleFile]);

    const handleReset = useCallback(() => {
        setLogData(null);
        setCurrentIndex(0);
        setIsPlaying(false);
        setError(null);
        setCardToZoom(null);
        setPortalTarget(null);
    }, []);

    const handleJumpToStart = useCallback(() => {
        setCurrentIndex(0);
        setIsPlaying(false);
    }, []);

    const handleJumpToEnd = useCallback(() => {
        setCurrentIndex(totalStates - 1);
        setIsPlaying(false);
    }, [totalStates]);


    if(!logData) {
        return (
            <div className='replay-container'>
                <div
                    className={ 'replay-upload' + (dragOver ? ' drag-over' : '') }
                    onDrop={ handleDrop }
                    onDragOver={ handleDragOver }
                    onDragLeave={ handleDragLeave }
                    onClick={ () => fileInputRef.current?.click() }
                >
                    <div className='replay-upload-icon'>
                        <Upload size={ 48 } />
                    </div>
                    <div className='replay-upload-text'>
                        Drop a game log file here, or click to browse
                    </div>
                    <div className='replay-upload-hint'>
                        Accepts .json.gz or .json files
                    </div>
                    <input
                        ref={ fileInputRef }
                        type='file'
                        accept='.json,.gz,.json.gz'
                        style={ { display: 'none' } }
                        onChange={ handleFileInput }
                    />
                </div>
                { error && <div className='replay-error'>{ error }</div> }
            </div>
        );
    }

    const entry = logData.replayData[currentIndex];
    const currentState = {
        ...entry.state,
        messages: entry.accumulatedMessages || []
    };

    const metadata = logData.metadata;
    const playerNames = metadata.players.map((p) => p.name);
    const username = playerNames[0] || '__replay_spectator__';

    const replayUser = {
        settings: {
            cardSize: 'normal',
            optionSettings: {}
        }
    };

    const metaText = metadata.players.map((p) => p.name + ' (' + p.faction + ')').join(' vs ')
        + (metadata.winner ? ' — Winner: ' + metadata.winner : '');

    return (
        <div className='replay-mode'>
            <div className='replay-navbar-info'>
                { metadata.gameName } — { metaText }
            </div>
            <InnerGameBoard
                currentGame={ currentState }
                username={ username }
                user={ replayUser }
                cards={ {} }
                cardToZoom={ cardToZoom }
                zoomCard={ setCardToZoom }
                clearZoom={ () => setCardToZoom(null) }
                dispatch={ noop }
                sendGameMessage={ noop }
                closeGameSocket={ noop }
                setContextMenu={ noop }
                socket={ {} }
            />
            { portalTarget && createPortal(
                <ReplayControls
                    currentIndex={ currentIndex }
                    totalStates={ totalStates }
                    isPlaying={ isPlaying }
                    speedIndex={ speedIndex }
                    onJumpToStart={ handleJumpToStart }
                    onJumpToEnd={ handleJumpToEnd }
                    onStepBack={ () => setCurrentIndex((i) => Math.max(0, i - 1)) }
                    onStepForward={ () => setCurrentIndex((i) => Math.min(totalStates - 1, i + 1)) }
                    onTogglePlay={ () => setIsPlaying(!isPlaying) }
                    onSpeedChange={ setSpeedIndex }
                    onReset={ handleReset }
                />,
                portalTarget
            ) }
        </div>
    );
}

GameReplay.displayName = 'GameReplay';

export default GameReplay;

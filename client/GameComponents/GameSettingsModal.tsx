import React, { useRef } from "react";
import GameConfiguration from "./GameConfiguration";
import type { Player } from "../types/game";

interface GameSettingsModalProps {
    show: boolean;
    thisPlayer: Player;
    onClose: () => void;
    onPromptedActionWindowToggle: (option: string, value: boolean) => void;
    onTimerSettingToggle: (option: string, value: boolean) => void;
    onOptionSettingToggle: (option: string, value: any) => void;
}

export default function GameSettingsModal(props: GameSettingsModalProps) {
    const modalRef = useRef<HTMLDivElement | null>(null);
    const { show, thisPlayer, onClose } = props;
    return (
        <>
            <div
                id="settings-modal"
                ref={ modalRef }
                className={ `modal fade ${show ? "in" : ""}` }
                style={ { display: show ? "block" : "none" } }
                tabIndex={ -1 }
                role="dialog"
            >
                <div className="modal-dialog" role="document">
                    <div className="modal-content settings-popup row">
                        <div className="modal-header">
                            <button type="button" className="close" aria-label="Close" onClick={ onClose }>
                                <span aria-hidden="true">×</span>
                            </button>
                            <h4 className="modal-title">Game Configuration</h4>
                        </div>
                        <div className="modal-body col-xs-12">
                            <GameConfiguration
                                actionWindows={ thisPlayer.promptedActionWindows }
                                timerSettings={ thisPlayer.timerSettings }
                                optionSettings={ thisPlayer.optionSettings }
                                onOptionSettingToggle={ props.onOptionSettingToggle }
                                onToggle={ props.onPromptedActionWindowToggle }
                                onTimerSettingToggle={ props.onTimerSettingToggle }
                            />
                        </div>
                    </div>
                </div>
            </div>
            { show && <div className="modal-backdrop fade in" onClick={ onClose } /> }
        </>
    );
}

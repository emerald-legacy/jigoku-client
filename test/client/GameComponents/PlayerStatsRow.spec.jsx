import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PlayerStatsRow } from '../../../client/GameComponents/PlayerStatsRow.jsx';

describe('the <PlayerStatsRow /> component', () => {
    let sendGameMessage;
    let defaultProps;

    beforeEach(() => {
        sendGameMessage = vi.fn();
        defaultProps = {
            sendGameMessage,
            stats: {
                fate: 5,
                honor: 10,
                conflictsRemaining: 2,
                politicalRemaining: 1,
                militaryRemaining: 1
            },
            user: {
                username: 'TestPlayer',
                emailHash: 'abc123'
            },
            handSize: 4,
            firstPlayer: false,
            otherPlayer: false,
            spectating: false,
            showControls: false
        };
    });

    describe('when rendered with stats', () => {
        beforeEach(() => {
            render(<PlayerStatsRow { ...defaultProps } />);
        });

        it('should display the player name', () => {
            expect(screen.getByText('TestPlayer')).toBeInTheDocument();
        });

        it('should display the fate value', () => {
            expect(screen.getByText('5')).toBeInTheDocument();
        });

        it('should display the honor value', () => {
            expect(screen.getByText('10')).toBeInTheDocument();
        });

        it('should display the conflicts remaining', () => {
            expect(screen.getByText(/Conflicts Remaining: 2/)).toBeInTheDocument();
        });
    });

    describe('when user is undefined', () => {
        beforeEach(() => {
            render(<PlayerStatsRow { ...defaultProps } user={ undefined } />);
        });

        it('should display "Noone" as the player name', () => {
            expect(screen.getByText('Noone')).toBeInTheDocument();
        });
    });

    describe('when stats are undefined', () => {
        beforeEach(() => {
            render(<PlayerStatsRow { ...defaultProps } stats={ undefined } />);
        });

        it('should display 0 for fate and honor', () => {
            const zeros = screen.getAllByText('0');
            expect(zeros.length).toBeGreaterThanOrEqual(2);
        });

        it('should display 0 for conflicts remaining', () => {
            expect(screen.getByText(/Conflicts Remaining: 0/)).toBeInTheDocument();
        });
    });

    describe('when firstPlayer is true', () => {
        beforeEach(() => {
            render(<PlayerStatsRow { ...defaultProps } firstPlayer />);
        });

        it('should show the first player indicator', () => {
            const firstPlayerImg = screen.getByTitle('First Player');
            expect(firstPlayerImg).toBeInTheDocument();
        });
    });

    describe('when firstPlayer is false', () => {
        beforeEach(() => {
            render(<PlayerStatsRow { ...defaultProps } firstPlayer={ false } />);
        });

        it('should not show the first player indicator', () => {
            const firstPlayerImg = screen.queryByTitle('First Player');
            expect(firstPlayerImg).not.toBeInTheDocument();
        });
    });

    describe('when showControls is true', () => {
        beforeEach(() => {
            render(<PlayerStatsRow { ...defaultProps } showControls />);
        });

        it('should render increment and decrement buttons', () => {
            const minusButtons = screen.getAllByTitle('-');
            const plusButtons = screen.getAllByTitle('+');
            expect(minusButtons.length).toBeGreaterThan(0);
            expect(plusButtons.length).toBeGreaterThan(0);
        });

        it('should call sendGameMessage with changeStat when minus is clicked', () => {
            const minusButtons = screen.getAllByTitle('-');
            fireEvent.click(minusButtons[0]);
            expect(sendGameMessage).toHaveBeenCalledWith('changeStat', expect.any(String), -1);
        });

        it('should call sendGameMessage with changeStat when plus is clicked', () => {
            const plusButtons = screen.getAllByTitle('+');
            fireEvent.click(plusButtons[0]);
            expect(sendGameMessage).toHaveBeenCalledWith('changeStat', expect.any(String), 1);
        });
    });

    describe('when showControls is false', () => {
        beforeEach(() => {
            render(<PlayerStatsRow { ...defaultProps } showControls={ false } />);
        });

        it('should not render increment and decrement buttons', () => {
            const minusButtons = screen.queryAllByTitle('-');
            const plusButtons = screen.queryAllByTitle('+');
            expect(minusButtons.length).toBe(0);
            expect(plusButtons.length).toBe(0);
        });
    });

    describe('hand size display', () => {
        describe('when otherPlayer is true', () => {
            beforeEach(() => {
                render(<PlayerStatsRow { ...defaultProps } otherPlayer handSize={ 7 } />);
            });

            it('should show hand size', () => {
                expect(screen.getByText(/Hand Size: 7/)).toBeInTheDocument();
            });
        });

        describe('when spectating is true', () => {
            beforeEach(() => {
                render(<PlayerStatsRow { ...defaultProps } spectating handSize={ 7 } />);
            });

            it('should show hand size', () => {
                expect(screen.getByText(/Hand Size: 7/)).toBeInTheDocument();
            });
        });

        describe('when neither otherPlayer nor spectating', () => {
            beforeEach(() => {
                render(<PlayerStatsRow { ...defaultProps } otherPlayer={ false } spectating={ false } handSize={ 7 } />);
            });

            it('should not show hand size', () => {
                expect(screen.queryByText(/Hand Size:/)).not.toBeInTheDocument();
            });
        });
    });

    describe('conflict icons', () => {
        it('should show political icon when politicalRemaining > 0', () => {
            render(<PlayerStatsRow { ...defaultProps } stats={ { ...defaultProps.stats, politicalRemaining: 1 } } />);
            const politicalIcons = document.querySelectorAll('.icon-political');
            expect(politicalIcons.length).toBe(1);
        });

        it('should show two political icons when politicalRemaining > 1', () => {
            render(<PlayerStatsRow { ...defaultProps } stats={ { ...defaultProps.stats, politicalRemaining: 2 } } />);
            const politicalIcons = document.querySelectorAll('.icon-political');
            expect(politicalIcons.length).toBe(2);
        });

        it('should show military icon when militaryRemaining > 0', () => {
            render(<PlayerStatsRow { ...defaultProps } stats={ { ...defaultProps.stats, militaryRemaining: 1 } } />);
            const militaryIcons = document.querySelectorAll('.icon-military');
            expect(militaryIcons.length).toBe(1);
        });

        it('should show two military icons when militaryRemaining > 1', () => {
            render(<PlayerStatsRow { ...defaultProps } stats={ { ...defaultProps.stats, militaryRemaining: 2 } } />);
            const militaryIcons = document.querySelectorAll('.icon-military');
            expect(militaryIcons.length).toBe(2);
        });
    });
});

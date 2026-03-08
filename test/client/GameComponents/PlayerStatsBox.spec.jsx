import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { PlayerStatsBox } from '../../../client/GameComponents/PlayerStatsBox.jsx';

describe('the <PlayerStatsBox /> component', () => {
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
            handSize: 4,
            firstPlayer: false,
            otherPlayer: false,
            showControls: false,
            size: 'normal'
        };
    });

    describe('when rendered with stats', () => {
        beforeEach(() => {
            render(<PlayerStatsBox { ...defaultProps } />);
        });

        it('should display the fate value', () => {
            expect(screen.getByText('5')).toBeInTheDocument();
        });

        it('should display the honor value', () => {
            expect(screen.getByText('10')).toBeInTheDocument();
        });

        it('should display the hand size', () => {
            expect(screen.getByText('4')).toBeInTheDocument();
        });

        it('should display the conflicts remaining', () => {
            expect(screen.getByText(/Conflicts: 2/)).toBeInTheDocument();
        });
    });

    describe('when stats are undefined', () => {
        beforeEach(() => {
            render(<PlayerStatsBox { ...defaultProps } stats={ undefined } />);
        });

        it('should display 0 for fate', () => {
            // Multiple zeros appear, one for fate
            const zeros = screen.getAllByText('0');
            expect(zeros.length).toBeGreaterThanOrEqual(1);
        });

        it('should display 0 for conflicts remaining', () => {
            expect(screen.getByText(/Conflicts: 0/)).toBeInTheDocument();
        });
    });

    describe('when firstPlayer is true', () => {
        beforeEach(() => {
            render(<PlayerStatsBox { ...defaultProps } firstPlayer />);
        });

        it('should show the first player indicator', () => {
            const firstPlayerImg = screen.getByTitle('First Player');
            expect(firstPlayerImg).toBeInTheDocument();
            expect(firstPlayerImg.className).not.toContain('hidden');
        });
    });

    describe('when firstPlayer is false', () => {
        beforeEach(() => {
            render(<PlayerStatsBox { ...defaultProps } firstPlayer={ false } />);
        });

        it('should hide the first player indicator', () => {
            const firstPlayerImg = screen.getByTitle('First Player');
            expect(firstPlayerImg.className).toContain('hidden');
        });
    });

    describe('when showControls is true', () => {
        beforeEach(() => {
            render(<PlayerStatsBox { ...defaultProps } showControls />);
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
            render(<PlayerStatsBox { ...defaultProps } showControls={ false } />);
        });

        it('should not render increment and decrement buttons', () => {
            const minusButtons = screen.queryAllByTitle('-');
            const plusButtons = screen.queryAllByTitle('+');
            expect(minusButtons.length).toBe(0);
            expect(plusButtons.length).toBe(0);
        });
    });

    describe('when otherPlayer is true', () => {
        beforeEach(() => {
            render(<PlayerStatsBox { ...defaultProps } otherPlayer />);
        });

        it('should not have "our-side" class', () => {
            const statsDiv = document.querySelector('.player-stats');
            expect(statsDiv.className).not.toContain('our-side');
        });
    });

    describe('when otherPlayer is false', () => {
        beforeEach(() => {
            render(<PlayerStatsBox { ...defaultProps } otherPlayer={ false } />);
        });

        it('should have "our-side" class', () => {
            const statsDiv = document.querySelector('.player-stats');
            expect(statsDiv.className).toContain('our-side');
        });
    });

    describe('conflict icons', () => {
        it('should show political icon when politicalRemaining > 0', () => {
            render(<PlayerStatsBox { ...defaultProps } stats={ { ...defaultProps.stats, politicalRemaining: 1 } } />);
            const politicalIcons = document.querySelectorAll('.icon-political');
            expect(politicalIcons.length).toBe(1);
        });

        it('should show two political icons when politicalRemaining > 1', () => {
            render(<PlayerStatsBox { ...defaultProps } stats={ { ...defaultProps.stats, politicalRemaining: 2 } } />);
            const politicalIcons = document.querySelectorAll('.icon-political');
            expect(politicalIcons.length).toBe(2);
        });

        it('should show military icon when militaryRemaining > 0', () => {
            render(<PlayerStatsBox { ...defaultProps } stats={ { ...defaultProps.stats, militaryRemaining: 1 } } />);
            const militaryIcons = document.querySelectorAll('.icon-military');
            expect(militaryIcons.length).toBe(1);
        });

        it('should show two military icons when militaryRemaining > 1', () => {
            render(<PlayerStatsBox { ...defaultProps } stats={ { ...defaultProps.stats, militaryRemaining: 2 } } />);
            const militaryIcons = document.querySelectorAll('.icon-military');
            expect(militaryIcons.length).toBe(2);
        });
    });
});

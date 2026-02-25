import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock jQuery and its plugins
vi.mock('jquery', () => {
    const mockJQuery = vi.fn((selector) => ({
        addClass: vi.fn(),
        removeClass: vi.fn(),
        modal: vi.fn(),
        offset: vi.fn(() => ({ left: 0, top: 0 })),
        scrollTop: vi.fn()
    }));
    mockJQuery.fn = { jquery: '3.6.0' };
    return { default: mockJQuery };
});

// Mock react-redux-toastr
vi.mock('react-redux-toastr', () => ({
    toastr: {
        confirm: vi.fn()
    }
}));

// Mock react-draggable
vi.mock('react-draggable', () => ({
    default: ({ children }) => <div data-testid="draggable">{children}</div>
}));

// Mock all the child components
vi.mock('../../client/GameComponents/PlayerStatsBox.jsx', () => ({
    default: () => <div data-testid="player-stats-box">PlayerStatsBox</div>
}));

vi.mock('../../client/GameComponents/PlayerStatsRow.jsx', () => ({
    default: () => <div data-testid="player-stats-row">PlayerStatsRow</div>
}));

vi.mock('../../client/GameComponents/PlayerHand.jsx', () => ({
    default: ({ cards }) => <div data-testid="player-hand">{cards?.length || 0} cards in hand</div>
}));

vi.mock('../../client/GameComponents/DynastyRow.jsx', () => ({
    default: () => <div data-testid="dynasty-row">DynastyRow</div>
}));

vi.mock('../../client/GameComponents/StrongholdRow.jsx', () => ({
    default: () => <div data-testid="stronghold-row">StrongholdRow</div>
}));

vi.mock('../../client/GameComponents/Ring.jsx', () => ({
    default: ({ ring }) => <div data-testid={`ring-${ring.element}`}>{ring.element}</div>
}));

vi.mock('../../client/GameComponents/HonorFan.jsx', () => ({
    default: ({ value }) => <div data-testid="honor-fan">{value}</div>
}));

vi.mock('../../client/GameComponents/ActivePlayerPrompt.jsx', () => ({
    default: ({ title }) => <div data-testid="active-player-prompt">{title}</div>
}));

vi.mock('../../client/Avatar.jsx', () => ({
    default: () => <div data-testid="avatar">Avatar</div>
}));

vi.mock('../../client/GameComponents/CardZoom.jsx', () => ({
    default: () => <div data-testid="card-zoom">CardZoom</div>
}));

vi.mock('../../client/GameComponents/Card.jsx', () => ({
    default: ({ card }) => <div data-testid="card">{card?.name || 'Card'}</div>
}));

vi.mock('../../client/GameComponents/Chat.jsx', () => ({
    default: () => <div data-testid="chat">Chat</div>
}));

vi.mock('../../client/GameComponents/Controls.jsx', () => ({
    default: () => <div data-testid="controls">Controls</div>
}));

vi.mock('../../client/GameComponents/CardPile.jsx', () => ({
    default: () => <div data-testid="card-pile">CardPile</div>
}));

vi.mock('../../client/GameComponents/GameConfiguration.jsx', () => ({
    default: () => <div data-testid="game-configuration">GameConfiguration</div>
}));

import { InnerGameBoard } from '../../client/GameBoard.jsx';

describe('the <GameBoard /> component', () => {
    let defaultProps;
    let mockPlayer;
    let mockRings;
    let mockConflict;

    beforeEach(() => {
        mockRings = {
            air: { element: 'air', removedFromGame: false, attachments: [] },
            earth: { element: 'earth', removedFromGame: false, attachments: [] },
            fire: { element: 'fire', removedFromGame: false, attachments: [] },
            void: { element: 'void', removedFromGame: false, attachments: [] },
            water: { element: 'water', removedFromGame: false, attachments: [] }
        };

        mockConflict = {
            attackingPlayerId: null,
            defendingPlayerId: null
        };

        mockPlayer = {
            id: 'player1',
            name: 'TestPlayer',
            user: {
                username: 'TestPlayer',
                emailHash: 'abc123'
            },
            cardPiles: {
                hand: [{ uuid: '1', name: 'Card 1' }, { uuid: '2', name: 'Card 2' }],
                cardsInPlay: [],
                conflictDiscardPile: [],
                conflictDeck: [],
                dynastyDiscardPile: [],
                dynastyDeck: [],
                provinceDeck: [],
                removedFromGame: []
            },
            provinces: {
                one: [],
                two: [],
                three: [],
                four: []
            },
            strongholdProvince: [],
            role: null,
            stats: { fate: 5, honor: 10 },
            clock: { mode: 'off' },
            buttons: [],
            promptedActionWindows: {},
            timerSettings: {},
            optionSettings: { showStatusInSidebar: true }
        };

        defaultProps = {
            currentGame: {
                players: {
                    TestPlayer: mockPlayer
                },
                spectators: [],
                messages: [],
                rings: mockRings,
                conflict: mockConflict,
                manualMode: false,
                started: true
            },
            username: 'TestPlayer',
            user: {
                settings: {
                    cardSize: 'normal',
                    optionSettings: { disableCardStats: false }
                }
            },
            cards: {},
            cardToZoom: null,
            socket: {},
            dispatch: vi.fn(),
            sendGameMessage: vi.fn(),
            closeGameSocket: vi.fn(),
            setContextMenu: vi.fn(),
            zoomCard: vi.fn(),
            clearZoom: vi.fn()
        };
    });

    describe('when currentGame is not provided', () => {
        it('should display waiting message', () => {
            render(<InnerGameBoard {...defaultProps} currentGame={null} />);
            expect(screen.getByText('Waiting for server...')).toBeInTheDocument();
        });
    });

    describe('when there are no players', () => {
        it('should display waiting for players message', () => {
            render(<InnerGameBoard {...defaultProps} currentGame={{ ...defaultProps.currentGame, players: {} }} />);
            expect(screen.getByText('Waiting for game to have players or close...')).toBeInTheDocument();
        });
    });

    describe('when rendered with a valid game', () => {
        beforeEach(() => {
            render(<InnerGameBoard {...defaultProps} />);
        });

        it('should render the game board', () => {
            expect(document.querySelector('.game-board')).toBeInTheDocument();
        });

        it('should render the active player prompt', () => {
            expect(screen.getByTestId('active-player-prompt')).toBeInTheDocument();
        });

        it('should render the chat component', () => {
            expect(screen.getByTestId('chat')).toBeInTheDocument();
        });

        it('should render the controls component', () => {
            expect(screen.getByTestId('controls')).toBeInTheDocument();
        });

        it('should render the card zoom component', () => {
            expect(screen.getByTestId('card-zoom')).toBeInTheDocument();
        });

        it('should render the rings', () => {
            // Rings are rendered in the center bar
            expect(screen.getAllByTestId('ring-air').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByTestId('ring-earth').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByTestId('ring-fire').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByTestId('ring-void').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByTestId('ring-water').length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('when user is a spectator', () => {
        beforeEach(() => {
            render(<InnerGameBoard {...defaultProps} username="SpectatorUser" />);
        });

        it('should render the game board', () => {
            expect(document.querySelector('.game-board')).toBeInTheDocument();
        });
    });

    describe('when there are two players', () => {
        beforeEach(() => {
            const otherPlayer = {
                ...mockPlayer,
                id: 'player2',
                name: 'OtherPlayer',
                user: {
                    username: 'OtherPlayer',
                    emailHash: 'def456'
                }
            };

            render(
                <InnerGameBoard
                    {...defaultProps}
                    currentGame={{
                        ...defaultProps.currentGame,
                        players: {
                            TestPlayer: mockPlayer,
                            OtherPlayer: otherPlayer
                        }
                    }}
                />
            );
        });

        it('should render the game board', () => {
            expect(document.querySelector('.game-board')).toBeInTheDocument();
        });

        it('should render dynasty rows for both players', () => {
            const dynastyRows = screen.getAllByTestId('dynasty-row');
            expect(dynastyRows.length).toBe(2);
        });

        it('should render stronghold rows for both players', () => {
            const strongholdRows = screen.getAllByTestId('stronghold-row');
            expect(strongholdRows.length).toBe(2);
        });
    });

    describe('when a ring is removed from game', () => {
        beforeEach(() => {
            const ringsWithRemoved = {
                ...mockRings,
                air: { element: 'air', removedFromGame: true, attachments: [] }
            };

            render(
                <InnerGameBoard
                    {...defaultProps}
                    currentGame={{
                        ...defaultProps.currentGame,
                        rings: ringsWithRemoved
                    }}
                />
            );
        });

        it('should show the removed rings section', () => {
            // The air ring should be in the removed section
            const removedRingsSection = document.querySelector('.removed-rings');
            expect(removedRingsSection).toBeInTheDocument();
        });
    });

    describe('when in manual mode', () => {
        beforeEach(() => {
            render(
                <InnerGameBoard
                    {...defaultProps}
                    currentGame={{
                        ...defaultProps.currentGame,
                        manualMode: true
                    }}
                />
            );
        });

        it('should render the game board', () => {
            expect(document.querySelector('.game-board')).toBeInTheDocument();
        });
    });

    describe('when there is an active conflict', () => {
        beforeEach(() => {
            const activeConflict = {
                attackingPlayerId: 'player1',
                defendingPlayerId: 'player2',
                attackerSkill: 5,
                defenderSkill: 3,
                type: 'military',
                elements: ['fire']
            };

            render(
                <InnerGameBoard
                    {...defaultProps}
                    currentGame={{
                        ...defaultProps.currentGame,
                        conflict: activeConflict
                    }}
                />
            );
        });

        it('should render the conflict panel', () => {
            const conflictPanel = document.querySelector('.conflict-panel');
            expect(conflictPanel).toBeInTheDocument();
        });

        it('should display skill values', () => {
            expect(screen.getByText('5')).toBeInTheDocument();
        });
    });

    describe('player hand', () => {
        it('should render player hand for the current player', () => {
            render(<InnerGameBoard {...defaultProps} />);
            expect(screen.getByTestId('player-hand')).toBeInTheDocument();
            expect(screen.getByText('2 cards in hand')).toBeInTheDocument();
        });
    });
});

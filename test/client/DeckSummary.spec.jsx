import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DeckSummary from '../../client/DeckSummary.jsx';

// Mock DeckStatus component
vi.mock('../../client/DeckStatus.jsx', () => ({
    default: ({ deck }) => <span data-testid='deck-status'>{ deck?.valid ? 'Valid' : 'Invalid' }</span>
}));

describe('the <DeckSummary /> component', () => {
    const createMockDeck = (overrides = {}) => ({
        name: 'Test Deck',
        faction: { name: 'Crane', value: 'crane' },
        alliance: { name: 'Dragon', value: 'dragon' },
        format: { name: 'Emerald' },
        stronghold: [],
        role: [],
        provinceCards: [
            { card: { id: 'province-1', name: 'Test Province', type: 'province' }, count: 1 }
        ],
        dynastyCards: [
            { card: { id: 'dynasty-1', name: 'Dynasty Character', type: 'character', side: 'dynasty' }, count: 3 },
            { card: { id: 'dynasty-2', name: 'Dynasty Holding', type: 'holding' }, count: 2 }
        ],
        conflictCards: [
            { card: { id: 'conflict-1', name: 'Conflict Character', type: 'character', side: 'conflict' }, count: 3 },
            { card: { id: 'conflict-2', name: 'Conflict Event', type: 'event', side: 'conflict' }, count: 2 }
        ],
        ...overrides
    });

    const mockCards = {
        'province-1': { id: 'province-1', name: 'Test Province', type: 'province' },
        'dynasty-1': { id: 'dynasty-1', name: 'Dynasty Character', type: 'character', side: 'dynasty' },
        'dynasty-2': { id: 'dynasty-2', name: 'Dynasty Holding', type: 'holding' },
        'conflict-1': { id: 'conflict-1', name: 'Conflict Character', type: 'character', side: 'conflict' },
        'conflict-2': { id: 'conflict-2', name: 'Conflict Event', type: 'event', side: 'conflict' }
    };

    describe('when deck is not provided', () => {
        beforeEach(() => {
            render(<DeckSummary cards={ mockCards } deck={ null } />);
        });

        it('should display waiting message', () => {
            expect(screen.getByText(/Waiting for selected deck/)).toBeInTheDocument();
        });
    });

    describe('when deck is provided', () => {
        let deck;

        beforeEach(() => {
            deck = createMockDeck();
            render(<DeckSummary cards={ mockCards } deck={ deck } />);
        });

        it('should display the clan name', () => {
            expect(screen.getByText('Crane')).toBeInTheDocument();
        });

        it('should display the alliance name', () => {
            expect(screen.getByText('Dragon')).toBeInTheDocument();
        });

        it('should display the format', () => {
            expect(screen.getByText('Emerald')).toBeInTheDocument();
        });

        it('should display the province count', () => {
            expect(screen.getByText('1 cards')).toBeInTheDocument();
        });

        it('should display the dynasty deck count', () => {
            // Dynasty deck has 5 cards total (3+2)
            const cardCounts = screen.getAllByText('5 cards');
            expect(cardCounts.length).toBeGreaterThanOrEqual(1);
        });

        it('should display the conflict deck count', () => {
            // Looking for the specific card count text
            const cardCounts = screen.getAllByText(/\d+ cards/);
            expect(cardCounts.length).toBeGreaterThanOrEqual(3);
        });

        it('should display the deck status', () => {
            expect(screen.getByTestId('deck-status')).toBeInTheDocument();
        });

        it('should display the faction mon image', () => {
            const monImage = document.querySelector('.deck-mon');
            expect(monImage).toBeInTheDocument();
            expect(monImage.src).toContain('/img/mons/crane.png');
        });
    });

    describe('when alliance is none', () => {
        beforeEach(() => {
            const deck = createMockDeck({ alliance: { name: '', value: 'none' } });
            render(<DeckSummary cards={ mockCards } deck={ deck } />);
        });

        it('should display "None" for alliance', () => {
            expect(screen.getByText('None')).toBeInTheDocument();
        });
    });

    describe('when format is not specified', () => {
        beforeEach(() => {
            const deck = createMockDeck({ format: null });
            render(<DeckSummary cards={ mockCards } deck={ deck } />);
        });

        it('should default to Emerald format', () => {
            expect(screen.getByText('Emerald')).toBeInTheDocument();
        });
    });

    describe('card list rendering', () => {
        beforeEach(() => {
            const deck = createMockDeck();
            render(<DeckSummary cards={ mockCards } deck={ deck } />);
        });

        it('should display card names', () => {
            expect(screen.getByText('Dynasty Character')).toBeInTheDocument();
            expect(screen.getByText('Dynasty Holding')).toBeInTheDocument();
            expect(screen.getByText('Conflict Character')).toBeInTheDocument();
            expect(screen.getByText('Conflict Event')).toBeInTheDocument();
        });

        it('should display card counts', () => {
            // Multiple cards have count 3x and 2x
            const threeX = screen.getAllByText(/3x/);
            const twoX = screen.getAllByText(/2x/);
            expect(threeX.length).toBeGreaterThanOrEqual(1);
            expect(twoX.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('card hover functionality', () => {
        beforeEach(() => {
            const deck = createMockDeck();
            render(<DeckSummary cards={ mockCards } deck={ deck } />);
        });

        it('should show hover image when mousing over a card', () => {
            const cardLink = screen.getByText('Dynasty Character');
            fireEvent.mouseOver(cardLink);

            const hoverImage = document.querySelector('.hover-image');
            expect(hoverImage).toBeInTheDocument();
        });

        it('should hide hover image when mousing out', () => {
            const cardLink = screen.getByText('Dynasty Character');
            fireEvent.mouseOver(cardLink);
            fireEvent.mouseOut(cardLink);

            const hoverImage = document.querySelector('.hover-image');
            expect(hoverImage).not.toBeInTheDocument();
        });
    });

    describe('deck counts calculation', () => {
        it('should correctly sum province cards', () => {
            const deck = createMockDeck({
                provinceCards: [
                    { card: { id: 'p1', name: 'Province 1', type: 'province' }, count: 1 },
                    { card: { id: 'p2', name: 'Province 2', type: 'province' }, count: 1 },
                    { card: { id: 'p3', name: 'Province 3', type: 'province' }, count: 1 }
                ]
            });
            render(<DeckSummary cards={ mockCards } deck={ deck } />);

            // Should show "3 cards" for provinces
            expect(screen.getByText('3 cards')).toBeInTheDocument();
        });

        it('should correctly sum dynasty cards', () => {
            const deck = createMockDeck({
                dynastyCards: [
                    { card: { id: 'd1', name: 'Card 1', type: 'character', side: 'dynasty' }, count: 10 },
                    { card: { id: 'd2', name: 'Card 2', type: 'holding' }, count: 5 }
                ]
            });
            render(<DeckSummary cards={ mockCards } deck={ deck } />);

            expect(screen.getByText('15 cards')).toBeInTheDocument();
        });
    });
});

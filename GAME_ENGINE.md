# Game Engine

## Overview
The slot machine engine is implemented as pure TypeScript functions in `/src/lib/game/`. It has zero UI dependencies and is fully unit-testable.

## Symbols

| Symbol | Weight | 2-match Payout | 3-match Payout |
|--------|--------|----------------|----------------|
| Cherry | 25 | 5x | 25x |
| Lemon | 22 | 5x | 30x |
| Orange | 20 | 8x | 40x |
| Grape | 18 | 10x | 50x |
| Watermelon | 15 | 15x | 75x |
| Wild | 5 | 20x | 100x |
| Scatter | 5 | 2x | 5x |

Wild substitutes for any fruit symbol. Scatter pays on total count regardless of position.

## Grid Layout
- 3 reels, 3 rows
- 5 paylines (top row, middle row, bottom row, diagonal down, diagonal up)

## RNG
- Uses `crypto.getRandomValues()` (Web Crypto API)
- Never uses `Math.random()`
- Symbol selection is weighted — higher-value symbols appear less frequently

## Payline Evaluation
1. For each payline, collect the 3 symbols
2. If the first symbol is Wild, use the next non-Wild symbol as the base
3. Count consecutive matches (including Wilds) from left to right
4. Look up the payout multiplier for that symbol and match count
5. Win = payout multiplier * bet per line * bonus multiplier (if active)

## Bonus Round
- **Trigger**: 3 or more Scatter symbols anywhere on the grid
- **Reward**: 10 free spins with 2x multiplier on all wins
- **During Bonus**: No bet is deducted from wallet
- **Bonus within Bonus**: Not retriggerable while active

## Bet Sizing
- Minimum bet per line: $0.10
- Maximum bet per line: $100.00
- Total bet = bet per line * 5 paylines
- Preset steps: 0.10, 0.25, 0.50, 1, 2, 5, 10, 25, 50, 100

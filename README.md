# Quadratic Voting DAO

> **Turbin3 Q1 2026 - Final Assignment** - A decentralized autonomous organization with quadratic voting mechanism built on Solana using Anchor.

## Overview

This is one of the **final two assignments** for the Turbin3 Q1 2026 cohort. Unlike previous assignments, there was **no starter repository** this project was built from scratch using `anchor init`, demonstrating the complete Anchor project creation and organization process.

This project implements a secure on-chain governance system using **quadratic voting** - a more equitable voting mechanism that reduces the influence of large token holders by making additional votes increasingly expensive.

### What is Quadratic Voting?

In traditional voting systems, 1 token = 1 vote, which can lead to plutocratic governance. Quadratic voting addresses this by using the square root of token holdings:

- **100 tokens** = √100 = **10 votes**
- **64 tokens** = √64 = **8 votes**
- **10,000 tokens** = √10,000 = **100 votes**

This ensures that while larger holders have more influence, the impact is substantially reduced, creating a more balanced governance system.

## Features

### Core Functionality
- **DAO Creation** - Initialize DAOs with custom names and authorities
- **Proposal Management** - Create and track proposals within DAOs
- **Quadratic Voting** - Vote on proposals with quadratic credit calculation
- **Vote Tracking** - Record individual votes with YES/NO support

### Security Features
- **Double Voting Prevention** - PDA-based vote accounts ensure one vote per user per proposal
- **Token Ownership Verification** - Validates voters actually own their token accounts
- **Vote Type Validation** - Only accepts valid vote types (0 = NO, 1 = YES)
- **Proposal Verification** - Ensures proposals belong to the correct DAO

## Architecture

### Program Structure
```
programs/
└── anchor-quadratic-voting-q1-26/
    └── src/
        ├── lib.rs                  # Program entry point
        ├── state/
        │   ├── dao.rs             # DAO account structure
        │   ├── proposal.rs        # Proposal account structure
        │   └── vote.rs            # Vote account structure
        ├── instructions/
        │   ├── init_dao.rs        # DAO initialization
        │   ├── init_proposal.rs   # Proposal creation
        │   └── cast_votes.rs      # Voting logic
        └── errors.rs              # Custom error definitions
```

### State Accounts

**DAO Account**
- Name
- Authority (creator)
- Proposal count
- Bump seed

**Proposal Account**
- Authority (creator)
- Metadata (description)
- Yes vote count (quadratic credits)
- No vote count (quadratic credits)
- Bump seed

**Vote Account**
- Authority (voter)
- Vote type (0 = NO, 1 = YES)
- Vote credits (quadratic calculation)
- Bump seed

## Getting Started

### Prerequisites
- Rust 1.75+
- Solana CLI 1.18+
- Anchor 0.32.1
- Node.js 18+
- Yarn

### Installation

```bash
cd anchor-quadratic-voting-q1-26

# Install dependencies
yarn install

# Build the program
anchor build

# Run tests
anchor test
```


## Testing

The test suite includes comprehensive coverage:

### Functional Tests
- DAO initialization
- Proposal creation
- YES vote casting with quadratic calculation
- NO vote casting with quadratic calculation

### Security Tests
- Double voting prevention
- Invalid vote type rejection
- Token account ownership verification

Run all tests:
```bash
anchor test
```

## 📚 Resources

- [Quadratic Voting Explained](https://en.wikipedia.org/wiki/Quadratic_voting)
- [Anchor Framework Docs](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Turbin3 Program](https://www.turbin3.org/)

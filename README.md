# Deep Focus DApp

A Solana-based focus timer application that incentivizes productivity through staking. Users stake SOL tokens before starting a focus session and get 99% back if they complete it, or lose their stake to the failure pool if they fail.

## Features

- **Stake-based Focus Sessions**: Users stake SOL before starting a timer
- **99% Return on Success**: Complete your session and get 99% of your stake back
- **Failure Pool**: Failed sessions contribute to a community failure pool
- **Real-time Balance**: See your SOL balance in the navbar
- **Session Status**: Track active sessions and stake amounts
- **Pool Statistics**: View focus pool, failure pool, and total sessions

## How It Works

1. **Connect Wallet**: Connect your Solana wallet (Phantom recommended)
2. **Set Timer**: Click the timer to set your focus duration (1-480 minutes)
3. **Set Stake**: Choose how much SOL to stake (minimum 0.01 SOL)
4. **Start Session**: Click "Start Focus Session" to begin
5. **Complete or Fail**: 
   - Complete: Get 99% of your stake back
   - Fail: Lose your stake to the failure pool

## Technical Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Blockchain**: Solana (Devnet)
- **Program**: Anchor Framework
- **Wallet**: Phantom Wallet integration

## Project Structure

```
deepwork-dapp/
├── anchor-program/          # Solana program (Anchor)
│   ├── programs/
│   │   └── anchor-program/
│   │       └── src/lib.rs   # Main program logic
│   └── target/idl/          # Generated IDL
├── frontend/                # Next.js frontend
│   ├── app/
│   │   ├── components/      # React components
│   │   ├── dashboard/       # Main app page
│   │   └── page.tsx         # Landing page
│   ├── hooks/               # Custom React hooks
│   └── lib/                 # Utilities and program client
```

## Getting Started

### Prerequisites

- Node.js 18+
- Rust (for Anchor program)
- Solana CLI
- Phantom Wallet (or compatible Solana wallet)

### Installation

1. **Install dependencies**:
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Anchor program
   cd ../anchor-program
   npm install
   ```

2. **Build the program**:
   ```bash
   cd anchor-program
   anchor build
   ```

3. **Deploy the program** (to devnet):
   ```bash
   anchor deploy
   ```

4. **Start the frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

### Configuration

The app is configured to use Solana Devnet by default. To change networks, update the connection URL in `frontend/lib/program.ts`.

## Program Instructions

- `initialize`: Initialize the global state and vaults
- `start_focus_session`: Start a new focus session with stake
- `complete_focus_session`: Complete an active session (get stake back)
- `fail_focus_session`: Fail an active session (lose stake)
- `expire_focus_session`: Automatically expire overdue sessions
- `withdraw_focus_pool`: Withdraw from focus pool (authority only)
- `withdraw_failure_pool`: Withdraw from failure pool (authority only)

## Smart Contract Logic

1. **Staking**: 99% goes to main vault, 1% to focus pool
2. **Success**: 99% returned from main vault to user
3. **Failure**: 99% moved from main vault to failure pool
4. **Expiry**: Automatic failure after grace period

## Development

### Frontend Development

```bash
cd frontend
npm run dev
```

### Program Development

```bash
cd anchor-program
anchor test
```

## Security Notes

- Always test on devnet before mainnet
- Verify program ID matches your deployment
- Check wallet permissions before staking
- Monitor for failed transactions

## License

MIT License


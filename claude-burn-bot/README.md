# 🔥 Claude Burn Bot

AI-powered memecoin buyback and burn Telegram bot for Solana.

## Features

- 🤖 **Telegram Bot** - Easy registration and management
- 🧠 **Claude AI Integration** - Analyzes DexScreener charts to time buybacks
- 💰 **Pump Portal** - Automatic creator fee claiming
- 🔥 **Smart Buyback & Burn** - AI-timed buybacks with Jupiter swaps
- 💎 **5% Service Fee** - Automatically flows to $CLAUDEBURN token
- 📊 **Three Modes** - Standard, Aggressive, Conservative

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in:

```env
TELEGRAM_BOT_TOKEN=your_bot_token
CLAUDE_API_KEY=your_anthropic_key
MAIN_TOKEN_ADDRESS=your_claudeburn_token
MAIN_WALLET_PRIVATE_KEY=your_wallet_key
SOLANA_NETWORK=mainnet-beta
```

### 3. Run the Bot

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## How It Works

1. **Fee Claiming** - Bot checks Pump Portal every 5 minutes for creator fees
2. **AI Analysis** - Claude AI analyzes token charts every 15 minutes
3. **Smart Buyback** - When AI detects a dip, executes buyback via Jupiter
4. **Service Fee** - Takes 5% and sends to main wallet
5. **Burn** - Sends tokens to Solana incinerator address

## Telegram Commands

- `/start` - Welcome message
- `/register` - Register a new token (multi-step flow)
- `/status` - View token stats
- `/settings <address> <burn_%> <mode>` - Update settings
- `/help` - Get help

## Architecture

```
src/
├── index.ts           # Main entry point
├── config.ts          # Configuration
├── database.ts        # SQLite database
├── logger.ts          # Logging system
├── dexscreener.ts     # DexScreener API integration
├── ai-analyzer.ts     # Claude AI chart analysis
├── pump-portal.ts     # Pump Portal fee claiming
├── buyback.ts         # Jupiter swaps & burning
├── telegram-handlers.ts # Bot command handlers
└── scheduler.ts       # Automated tasks
```

## Modes

- **Standard** - 5% dip threshold, 50% of fees
- **Aggressive** - 3% dip threshold, 75% of fees
- **Conservative** - 10% dip threshold, 30% of fees

## License

MIT

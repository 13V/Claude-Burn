#!/bin/bash
# Quick devnet setup script

echo "🔥 Claude Burn - Devnet Setup"
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env already exists! Backup created as .env.backup"
    cp .env .env.backup
fi

# Create .env from template
cp .env.example .env

echo "✅ Created .env file"
echo ""
echo "📝 Next steps:"
echo "1. Edit .env and add your keys:"
echo "   - TELEGRAM_BOT_TOKEN (from @BotFather)"
echo "   - CLAUDE_API_KEY (from Anthropic)"
echo "   - ADMIN_TELEGRAM_IDS (your Telegram user ID)"
echo ""
echo "2. Get devnet SOL:"
echo "   solana airdrop 2 <your_wallet> --url devnet"
echo ""
echo "3. Install dependencies:"
echo "   npm install"
echo ""
echo "4. Start bot:"
echo "   npm run dev"
echo ""
echo "📖 See DEVNET_TESTING.md for full guide"

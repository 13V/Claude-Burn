# Devnet Testing Guide

Quick guide to test Claude Burn bot on Solana devnet before mainnet launch.

## Step 1: Setup Environment

### Create `.env` file from template:
```bash
cd claude-burn-bot
cp .env.example .env
```

### Edit `.env` with devnet configuration:
```bash
# Telegram Bot
TELEGRAM_BOT_TOKEN=<your_bot_token>  # From @BotFather
CLAUDE_API_KEY=<your_claude_key>     # From Anthropic

# Solana DEVNET Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Test Wallet (create a new devnet wallet)
MAIN_TOKEN_ADDRESS=<your_test_token_address>
MAIN_WALLET_PRIVATE_KEY=<your_devnet_wallet_private_key>

# Admin Control
ADMIN_TELEGRAM_IDS=<your_telegram_id>

# Database
DATABASE_PATH=./data/tokens-devnet.db
```

## Step 2: Get Devnet SOL

### Create a devnet wallet:
```bash
solana-keygen new --outfile devnet-wallet.json
```

### Get wallet address:
```bash
solana-keygen pubkey devnet-wallet.json
```

### Request devnet SOL (airdrop):
```bash
solana airdrop 2 <your_wallet_address> --url devnet
```

Or use the web faucet: https://faucet.solana.com/

## Step 3: Create Test Token

**Option A: Use pumpfun devnet** (if available)
- Check if pumpfun has a devnet version
- Create a test token there

**Option B: Create SPL token manually**
```bash
# Install spl-token CLI
npm install -g @solana/spl-token

# Create token
spl-token create-token --url devnet

# Create token account
spl-token create-account <token_address> --url devnet

# Mint tokens
spl-token mint <token_address> 1000000 --url devnet
```

## Step 4: Install Dependencies

```bash
cd claude-burn-bot
npm install
```

## Step 5: Start the Bot

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

## Step 6: Test via Telegram

### 1. Start the bot
Send `/start` to your Telegram bot

### 2. Register your test token
Send `/register` and follow the prompts:
- Token address: `<your_devnet_token_address>`
- Wallet private key: `<devnet_wallet_private_key>`
- Burn percentage: `50`
- Mode: `standard`

### 3. Check status
Send `/status` to view your token

## Step 7: Monitor Logs

Watch the console output or check log files:
```bash
# Watch logs in real-time
tail -f logs/<date>.log

# On Windows PowerShell:
Get-Content .\logs\<date>.log -Wait
```

**Look for:**
- ✅ AI analysis decisions
- ✅ Fee claiming attempts
- ✅ Buyback executions
- ✅ Burn transactions
- ❌ Any errors

## Step 8: Verify Transactions

### Check on Solscan Devnet:
https://solscan.io/?cluster=devnet

Search for:
1. **Buyback transactions** - Should show SOL → Token swap
2. **Burn transactions** - Should show tokens sent to incinerator
3. **Fee claims** - SOL received from creator fees

### Verify burn address:
Check that tokens are at: `1nc1nerator11111111111111111111111111111111`

## Step 9: Test Admin Controls

### Pause system:
```
/pauseall
```
Bot should respond and stop all operations

### Resume system:
```
/resumeall
```
Bot should resume operations

## Step 10: Expected Flow

```
1. Bot starts → Logs "Scheduler started successfully"
2. Every 5 min → "Checking fees for all tokens..."
3. Every 2 min → "Running AI analysis for all tokens..."
4. AI detects dip → "AI recommends buyback"
5. Buyback executes → "BUYBACK" transaction logged
6. Burn executes → "BURN" transaction logged
7. Telegram notification sent
```

## Common Issues & Solutions

### "Cannot find module..."
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Insufficient SOL balance"
```bash
# Airdrop more devnet SOL
solana airdrop 2 <wallet_address> --url devnet
```

### "Failed to fetch DexScreener data"
- Normal on devnet - DexScreener doesn't index devnet tokens
- AI will skip analysis if no price data

### "Pump Portal API failed"
- Pump Portal may not support devnet
- You can simulate fees by manually sending SOL to the wallet

## Manual Testing Without Pumpfun

If pumpfun doesn't have devnet:

1. **Simulate fees**: Send devnet SOL to your token's wallet manually
2. **Trigger AI analysis**: Wait 2 minutes or restart bot
3. **Check buyback**: Bot should attempt Jupiter swap
4. **Verify burn**: Check incinerator address has tokens

## Devnet vs Mainnet Differences

| Feature | Devnet | Mainnet |
|---------|--------|---------|
| SOL | Free (airdrop) | Real money |
| Pumpfun | May not work | Full support |
| DexScreener | No data | Live data |
| Jupiter | Works | Works |
| Transaction speed | Slower | Faster |
| Risk | Zero | Production |

## Success Criteria

✅ Bot connects to Telegram
✅ Token registration works
✅ AI analysis runs every 2 minutes
✅ Buybacks execute (even if no price data)
✅ Burns send tokens to incinerator
✅ Admin commands work
✅ Logs show all operations
✅ No critical errors

## Next Steps

Once devnet testing passes:

1. ✅ Verify all transactions on Solscan
2. ✅ Test with multiple tokens
3. ✅ Let it run for 1+ hour
4. 📝 Update `.env` with mainnet config
5. 🚀 Deploy to mainnet!

---

**Need help?** Check the logs first, they're very detailed!

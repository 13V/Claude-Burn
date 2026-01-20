# Creating Your Telegram Bot

## Step-by-Step Guide

### 1. Open Telegram
Open Telegram on your phone or computer

### 2. Find BotFather
Search for **@BotFather** in Telegram (it's an official Telegram bot)

### 3. Start BotFather
Click **Start** or send `/start`

### 4. Create New Bot
Send this command:
```
/newbot
```

### 5. Choose Bot Name
BotFather will ask: **"Alright, a new bot. How are we going to call it?"**

Reply with your bot's display name (can be anything):
```
Claude Burn Bot
```

### 6. Choose Bot Username
BotFather will ask: **"Now, let's choose a username for your bot."**

Reply with a unique username (must end in "bot"):
```
claudeburn_bot
```
or
```
yourusername_claudeburn_bot
```

**Note:** Username must be unique. If taken, try adding numbers or your name.

### 7. Get Your Token
BotFather will respond with your bot token that looks like:
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

**🔴 IMPORTANT:** 
- Copy this token immediately
- Keep it SECRET - anyone with this token controls your bot
- Never commit it to GitHub

### 8. (Optional) Set Bot Profile

#### Add profile picture:
```
/setuserpic
```
Select your bot, then upload an image

#### Add description:
```
/setdescription
```
Select your bot, then type:
```
AI-powered memecoin buyback and burn system on Solana. Register your token to automatically claim fees and execute smart burns!
```

#### Add about text:
```
/setabouttext
```
Select your bot, then type:
```
🔥 Claude Burn - AI-powered buyback & burn for Solana memecoins
```

### 9. Add Your Token to .env

Open your `.env` file and add:
```bash
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

### 10. Find Your Telegram User ID

To use admin commands, you need your Telegram user ID:

#### Option A: Use a bot
1. Search for **@userinfobot** on Telegram
2. Send `/start`
3. It will show your user ID (e.g., `123456789`)

#### Option B: Use another bot
1. Search for **@get_id_bot**
2. Send `/start`
3. Copy your ID

Add it to `.env`:
```bash
ADMIN_TELEGRAM_IDS=123456789
```

## Quick Summary

1. Message **@BotFather** on Telegram
2. Send `/newbot`
3. Choose name: `Claude Burn Bot`
4. Choose username: `claudeburn_bot` (or similar)
5. Copy the token
6. Add token to `.env` file
7. Get your user ID from **@userinfobot**
8. Add your user ID to `.env`

## Example .env Setup

```bash
# Your bot token from BotFather
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890

# Your user ID from @userinfobot
ADMIN_TELEGRAM_IDS=123456789

# Continue with other settings...
CLAUDE_API_KEY=your_claude_key
SOLANA_NETWORK=devnet
```

## Test Your Bot

Once you've added the token to `.env`:

1. Start your bot: `npm run dev`
2. Find your bot in Telegram (search for username)
3. Click **Start**
4. Send `/start` - you should get a welcome message!

---

**That's it!** Your bot is ready. Now you can continue with the devnet setup.

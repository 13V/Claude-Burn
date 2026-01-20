# Claude Craft AI 🎮🤖

An AI-powered Minecraft speedrun bot that uses Claude to make strategic decisions while attempting to beat the game, with live streaming support for PumpFun.

## Features

- **AI-Powered Gameplay**: Claude 3.5 Sonnet makes real-time decisions about what to do next
- **Speedrun Strategy**: Optimized for the fastest path to defeating the Ender Dragon
- **Live Visualization**: Prismarine-viewer provides a live web-based view of the bot's perspective
- **Streaming Ready**: Works with OBS to stream to PumpFun via RTMP

## Prerequisites

1. **Minecraft Java Edition** (licensed copy)
2. **Minecraft Server** running locally (vanilla or Paper)
3. **Node.js 18+**
4. **OBS Studio** (for streaming)
5. **PumpFun account** with RTMP streaming enabled

## Setup

### 1. Install Dependencies

```bash
cd claude-craft-ai
npm install
```

### 2. Configure Environment

Edit `.env` with your settings:

```env
ANTHROPIC_API_KEY=your_api_key
MINECRAFT_HOST=localhost
MINECRAFT_PORT=25565
MINECRAFT_USERNAME=ClaudeCraftBot
MINECRAFT_VERSION=1.20.4
VIEWER_PORT=3000
```

### 3. Start Minecraft Server

Download and run a Minecraft server:

```bash
# Download server.jar from minecraft.net
java -Xmx2G -jar server.jar nogui
```

Set `online-mode=false` in `server.properties` for bot access.

### 4. Run the Bot

```bash
npm start
```

The bot will:
1. Connect to your Minecraft server
2. Start the viewer at `http://localhost:3000`
3. Begin the AI-powered speedrun

### 5. Stream to PumpFun

1. Open OBS Studio
2. Add **Browser Source** → `http://localhost:3000`
3. Go to Settings → Stream
4. Service: Custom
5. Server: Your PumpFun RTMP URL
6. Stream Key: Your PumpFun Stream Key
7. Click "Start Streaming"

## How It Works

```
┌─────────────────────────────────────────────────┐
│                  GAME LOOP                       │
├─────────────────────────────────────────────────┤
│  1. Capture game state (position, inventory,    │
│     nearby blocks/entities, phase)              │
│                    ↓                            │
│  2. Send state to Claude AI                     │
│                    ↓                            │
│  3. Claude decides next action                  │
│     (mine, craft, navigate, attack, etc.)       │
│                    ↓                            │
│  4. Execute action via Mineflayer               │
│                    ↓                            │
│  5. Repeat until dragon defeated!               │
└─────────────────────────────────────────────────┘
```

## Speedrun Phases

1. **Early Game** - Gather wood, make tools
2. **Tool Progression** - Get iron, better tools
3. **Nether Prep** - Build portal, gather resources
4. **Nether** - Find fortress, kill blazes
5. **End Prep** - Hunt endermen, craft eyes
6. **Stronghold** - Find and activate portal
7. **End Fight** - Destroy crystals, kill dragon

## Project Structure

```
claude-craft-ai/
├── src/
│   ├── index.ts          # Main entry point
│   ├── ai/
│   │   └── claude.ts     # AI integration
│   └── bot/
│       ├── gameState.ts  # State capture
│       └── actions.ts    # Action executor
├── .env                  # Configuration
├── package.json
└── tsconfig.json
```

## Troubleshooting

**Bot can't connect?**
- Ensure server is running
- Check `online-mode=false` in server.properties
- Verify port matches

**AI not responding?**
- Check API key in `.env`
- Verify internet connection

**Viewer not loading?**
- Check port 3000 is not in use
- Try different browser

## License

MIT

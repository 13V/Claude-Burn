import express, { Request, Response } from 'express';
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { Bot } from 'mineflayer';

export class OverlayServer {
    private app: express.Application;
    private server: HttpServer;
    private io: SocketServer;
    private bot: Bot;
    private port: number;

    constructor(bot: Bot, port: number = 3001) {
        this.bot = bot;
        this.port = port;
        this.app = express();
        this.server = new HttpServer(this.app);
        this.io = new SocketServer(this.server);

        this.setupRoutes();
        this.setupSocket();
    }

    private setupRoutes() {
        // Serve a simple HUD page
        this.app.get('/', (req: Request, res: Response) => {
            res.send(this.generateHUDHtml());
        });
    }

    private setupSocket() {
        this.io.on('connection', (socket) => {
            console.log('📡 Overlay client connected');

            // Send initial state
            this.sendUpdate();

            socket.on('disconnect', () => {
                console.log('📡 Overlay client disconnected');
            });
        });

        // Update loop - every 500ms
        setInterval(() => {
            this.sendUpdate();
        }, 500);
    }

    private sendUpdate() {
        if (!this.bot) return;

        const state = {
            health: this.bot.health,
            food: this.bot.food,
            inventory: this.bot.inventory.items().map(item => ({
                name: item.name,
                count: item.count
            })),
            position: this.bot.entity?.position,
            oxygen: this.bot.oxygenLevel
        };

        this.io.emit('stateUpdate', state);
    }

    public start() {
        this.server.listen(this.port, () => {
            console.log(`🎮 Dashboard Overlay started at http://localhost:${this.port}`);
        });
    }

    private generateHUDHtml() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Claude Craft HUD</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700&display=swap" rel="stylesheet">
    <style>
        body {
            margin: 0;
            padding: 20px;
            background: transparent;
            font-family: 'Outfit', sans-serif;
            color: white;
            overflow: hidden;
        }
        .container {
            display: flex;
            flex-direction: column;
            gap: 20px;
            width: 300px;
            background: rgba(0, 0, 0, 0.7);
            padding: 20px;
            border-radius: 15px;
            border: 1px solid rgba(255, 107, 53, 0.3);
            backdrop-filter: blur(10px);
        }
        .stat-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .bar-container {
            flex-grow: 1;
            height: 12px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 6px;
            overflow: hidden;
        }
        .bar-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        .health-fill { background: #ff4d4d; }
        .food-fill { background: #ffa64d; }
        
        .inventory {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 5px;
        }
        .inv-slot {
            aspect-ratio: 1;
            background: rgba(255, 255, 255, 0.05);
            border-radius: 5px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            position: relative;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .inv-count {
            position: absolute;
            bottom: 2px;
            right: 2px;
            font-weight: bold;
        }
        .title {
            color: #FF6B35;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-size: 14px;
            margin-bottom: 5px;
        }
        .label { font-size: 12px; font-weight: bold; width: 60px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="title">Claude Craft AI Status</div>
        
        <div class="stat-row">
            <div class="label">HEALTH</div>
            <div class="bar-container">
                <div id="health-bar" class="bar-fill health-fill" style="width: 100%"></div>
            </div>
            <div id="health-val" style="min-width: 25px">20</div>
        </div>

        <div class="stat-row">
            <div class="label">FOOD</div>
            <div class="bar-container">
                <div id="food-bar" class="bar-fill food-fill" style="width: 100%"></div>
            </div>
            <div id="food-val" style="min-width: 25px">20</div>
        </div>

        <div class="title" style="margin-top: 10px">Inventory</div>
        <div id="inventory" class="inventory">
            <!-- Slots will be injected here -->
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        const healthBar = document.getElementById('health-bar');
        const healthVal = document.getElementById('health-val');
        const foodBar = document.getElementById('food-bar');
        const foodVal = document.getElementById('food-val');
        const inventoryDiv = document.getElementById('inventory');

        socket.on('stateUpdate', (state) => {
            // Update Stats
            const healthPct = (state.health / 20) * 100;
            healthBar.style.width = healthPct + '%';
            healthVal.innerText = Math.round(state.health);

            const foodPct = (state.food / 20) * 100;
            foodBar.style.width = foodPct + '%';
            foodVal.innerText = Math.round(state.food);

            // Update Inventory
            inventoryDiv.innerHTML = '';
            // Show first 12 items or empty slots
            for (let i = 0; i < 12; i++) {
                const item = state.inventory[i];
                const slot = document.createElement('div');
                slot.className = 'inv-slot';
                if (item) {
                    slot.innerText = item.name.split('_').pop().substring(0, 3).toUpperCase();
                    slot.innerHTML += \`<div class="inv-count">\${item.count}</div>\`;
                    slot.title = item.name;
                }
                inventoryDiv.appendChild(slot);
            }
        });
    </script>
</body>
</html>
        `;
    }
}

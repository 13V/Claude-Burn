import mc from 'minecraft-protocol';
import { Bot } from 'mineflayer';
import { Vec3 } from 'vec3';

export class RelayProxy {
    private bot: Bot;
    private server: mc.Server;
    private port: number;
    private clients: Set<mc.Client> = new Set();

    constructor(bot: Bot, port: number = 25566) {
        this.bot = bot;
        this.port = port;

        // @ts-ignore
        this.server = mc.createServer({
            'online-mode': false,
            version: '1.20.4',
            port: this.port,
            motd: 'Claude Craft AI Relay',
            maxPlayers: 5
        });

        this.setupServer();
    }

    private setupServer() {
        this.server.on('login', (client) => {
            console.log(`🔌 Local client ${client.username} joined relay`);
            this.clients.add(client);

            // Send Join Game
            client.write('login', {
                entityId: this.bot.entity.id,
                levelType: 'default',
                gameMode: 0,
                previousGameMode: 255,
                worldNames: ['minecraft:overworld'],
                dimensionCodec: {}, // Not fully accurate but enough for view
                dimension: 'minecraft:overworld',
                worldName: 'minecraft:overworld',
                hashedSeed: [0, 0],
                maxPlayers: 1,
                viewDistance: 10,
                simulationDistance: 10,
                reducedDebugInfo: false,
                enableRespawnScreen: true,
                isDebug: false,
                isFlat: false,
                deathLocation: null,
                portalCooldown: 0
            });

            // Mirror bot's position
            const pos = this.bot.entity.position;
            client.write('position', {
                x: pos.x,
                y: pos.y,
                z: pos.z,
                yaw: this.bot.entity.yaw,
                pitch: this.bot.entity.pitch,
                flags: 0,
                teleportId: 0
            });

            client.on('end', () => {
                console.log(`🔌 Local client ${client.username} left relay`);
                this.clients.delete(client);
            });
        });

        // Mirror bot packets to relay clients
        // Note: This is a simplified relay. Full packet mirroring requires more logic,
        // but for a "spectator" view, position and world updates are key.

        // Every physics tick, update client positions
        this.bot.on('physicsTick', () => {
            if (this.clients.size === 0) return;

            const pos = this.bot.entity.position;
            const update = {
                x: pos.x,
                y: pos.y,
                z: pos.z,
                yaw: this.bot.entity.yaw,
                pitch: this.bot.entity.pitch,
                onGround: this.bot.entity.onGround
            };

            for (const client of this.clients) {
                client.write('position', {
                    ...update,
                    flags: 0,
                    teleportId: 0
                });
            }
        });
    }

    public start() {
        console.log(`📡 Relay Proxy started at localhost:${this.port}`);
        console.log('💡 Join in Minecraft with: localhost:25566');
    }
}

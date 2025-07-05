import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import propertiesReader from 'properties-reader';
import mc from 'minecraftstatuspinger';
import fs from 'node:fs';
import path from 'node:path';

export type ServerState = 'Running' | 'Stopped' | 'Starting' | 'Stopping';

type PlayerSample = {
    name: string,
    id: string
};

const serversFolderPath = path.join(import.meta.dirname, '../../servers');

export class MinecraftServer {
    private _name: string;
    private _serverPath: string;
    private _state: ServerState;
    private _process: ChildProcessWithoutNullStreams | undefined;
    private _serverPort: number;
    private _isPublic: boolean;
    private _serverUninitialized: boolean = false;

    constructor(name: string, folderName: string, isPublic: boolean) {
        this._name = name;
        this._isPublic = isPublic;
        this._state = 'Stopped';

        this._serverPath = path.join(serversFolderPath, folderName);
        console.log("Path:", this._serverPath);

        if (!fs.existsSync(this._serverPath) || !fs.lstatSync(this._serverPath).isDirectory()) {
            throw new Error("Cannot create server instance at " + this._serverPath + 
                " because it does not exist or is not a directory.");
        }

        if (!fs.existsSync(path.join(this._serverPath, 'server.properties'))) {
            this._serverUninitialized = true;
            this._serverPort = -1;
            console.log(`It seems like server "${this._name}" is not initialized (cannot find server.properties). `
                + "Start the server to initialize it.");
            return;
        }

        this._serverPort = this.readPort();
        if (this._serverPort === -1) {
            throw new Error("Cannot create server instance: invalid port");
        }
    }

    private readPort(): number {
        const properties = propertiesReader(path.join(this._serverPath, 'server.properties'));
        const port = properties.get('server-port');

        if (port === null) {
            console.error(`Error: cannot read server port for server ${this._name}`);
            return -1;
        }
        if (Number.isNaN(+port)) {
            console.error(`Error: server port is not a valid integer for server ${this._name}`);
            return -1;
        }

        return +port;
    }

    get state() {
        return this._state;
    }

    get name() {
        return this._name;
    }

    get port() {
        return this._serverPort;
    }

    get isPublic() {
        return this._isPublic;
    }

    get isUninitialized() {
        return this._serverUninitialized;
    }

    public getStateMessage(): string {
        switch (this.state) {
            case 'Running':
                return '<:Online:1343628871022678167> En ligne';
            case 'Stopped':
                return '<:Offline:1343629125994287247> Hors ligne';
            case 'Starting':
                return '<:Online:1343628871022678167> Démarrage...';
            case 'Stopping':
                return '<:Offline:1343629125994287247> Arrêt en cours...';
        };
    }

    public start(): Promise<boolean> {
        return new Promise(res => {
            if (this._state != 'Stopped') return false;

            if (this._process !== undefined) {
                console.error('Error: server is "stopped" but this._process is not undefined');
                return false;
            }

            // Making sure server has a valid port or is uninitialized
            if (this._serverUninitialized) {
                if (fs.existsSync(path.join(this._serverPath, 'server.properties'))) {
                    this._serverUninitialized = false;
                    this._serverPort = this.readPort();
                }
            } else {
                this._serverPort = this.readPort();
            }

            if (!this._serverUninitialized && this._serverPort === -1) {
                console.error("Could not start server: invalid port");
                return false;
            }

            this._state = 'Starting';

            const runScriptPath = path.join(this._serverPath, 'run.sh');
            this._process = spawn(runScriptPath, { cwd: this._serverPath });

            // Handle spawn failure
            this._process.on('error', err => {
                console.error("Error when spawning minecraft server:");
                console.error(err);
                this._state = 'Stopped';
                this._process = undefined;
                res(false);
            });

            // Handle spawn success
            this._process.on('spawn', () => {
                res(true);
                console.log(`Server "${this._name}" just started.`);
            });

            // Checking for the message 'Done' in servers logs,
            // indicating the server finished starting.
            this._process.stdout.on('data', (chunk: Buffer) => {
                if (chunk.toString().match(/Done \(.*\)! For help, type "help"/)) {
                    this._state = 'Running';
                    console.log(`Server "${this._name}" finished starting.`);
                }
            });

            // Handle process exit
            this._process.on('exit', () => {
                const prevState = this._state;
                this._process = undefined;
                this._state = 'Stopped';

                if (prevState === 'Starting') {
                    console.log(`[WARN] Server "${this._name}" exited during startup.`);
                } else if (prevState === 'Stopping') {
                    console.log(`Server "${this._name}" just exited.`);
                } else if (prevState === 'Running') {
                    console.log(`Server "${this._name}" exited by itself: restarting...`);
                    this.start();
                } else if (prevState === 'Stopped') {
                    console.error(`[WARN] Illegal state: Server "${this._name}" just exited but state was "Stopped"`);
                }
            });
        });
    }

    public stop(): Promise<boolean> {
        return new Promise(res => {
            if (this._state != 'Running') {
                res(false);
                return;
            }

            if (this._process === undefined) {
                console.error('Error: Server is "Running" but this._process is undefined');
                res(false);
                return;
            }
    
            this._process.on('exit', () => {
                res(true);
            });

            this._state = 'Stopping';
            this._process.stdin.write("stop\r");
            // The process.on('exit') callback defined in start() will
            // take care of the state update and cleaning
        });
    }

    public async lookupStatus() {
        try {
            const result = await mc.lookup({
                host: 'localhost',
                port: this._serverPort,
                ping: false,
                timeout: 2000   // 2 seconds timeout, because discord timeout 
                                // for interaction response is 3 seconds.
            });    

            return {
                version: {
                    name: result.status?.version?.name as string | undefined,
                    protocol: result.status?.version?.protocol as number | undefined
                },
                players: {
                    max: result.status?.players?.max as number | undefined,
                    online: result.status?.players?.online as number | undefined,
                    sample: result.status?.players?.sample as PlayerSample[] | undefined
                }
            };
        } catch (err) {
            console.error(`Error when looking up status of ${this._name}:`);
            console.error(err);

            return {
                version: {
                    name: undefined,
                    protocol: undefined
                },
                players: {
                    max: undefined,
                    online: undefined,
                    sample: undefined
                }
            }
        }
    }
}
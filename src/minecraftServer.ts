import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import propertiesReader from 'properties-reader';
import mc from 'minecraftstatuspinger';
import fs from 'node:fs';
import path from 'node:path';

export type ServerState = 'Running' | 'Stopped' | 'Starting' | 'Stopping' | 'Rebooting';
type PlayerSample = {
    name: string,
    id: string
};

const serversFolderPath = path.join(import.meta.dirname, '../../servers');

export class MinecraftServer {
    private _name: string;
    private _serverPath: string;
    private _state: ServerState = 'Stopped';
    private _process: ChildProcessWithoutNullStreams | undefined;
    private _serverPort: number;

    constructor(name: string, folderName: string) {
        this._name = name;

        this._serverPath = path.join(serversFolderPath, folderName);
        console.log("Path:", this._serverPath);

        if (!fs.lstatSync(this._serverPath).isDirectory()) {
            console.error("Error: cannot create server instance at", this._serverPath, 
                "because it is not a directory.");
        }

        this._serverPort = this.readPort();
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

    public start(): Promise<boolean> {
        return new Promise(res => {
            if (this._state != 'Stopped') return false;

            if (this._process !== undefined) {
                console.error('Error: server is "stopped" but this._process is not undefined');
                return false;
            }

            this._state = 'Starting';

            const runScriptPath = path.join(this._serverPath, 'run.sh');
            this._process = spawn(runScriptPath, { cwd: this._serverPath });

            this._process.on('error', err => {
                console.error("Error when spawning minecraft server:");
                console.error(err);
                this._state = 'Stopped';
                this._process = undefined;
                res(false);
            });

            this._process.on('spawn', () => {
                res(true);
                this._state = 'Running';
                console.log(`Server "${this._name}" just started.`);
            });

            this._process.on('exit', () => {
                this._process = undefined;
                this._state = 'Stopped';
                console.log(`Server "${this._name}" just exited.`);
            });

            // Update port in case it was modified since last boot
            this._serverPort = this.readPort();
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
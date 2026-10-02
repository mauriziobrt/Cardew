import dgram from 'dgram';

export interface OSCInt {
    type: 'int';
    value: number;
}

export interface OSCFloat {
    type: 'float';
    value: number;
}

export type OSCValue = number | string | boolean | null | OSCInt | OSCFloat;
// export type OSCValue = number | string | OSCInt | OSCFloat;

export class OSCManager {
    private socket: dgram.Socket;
    private remoteAddress: string;
    private remotePort: number;
    private onMessageCallback?: (address: string, args: OSCValue[]) => void;
    private messageQueue: Array<{ address: string; args: OSCValue[] }> = [];
    private readonly MAX_QUEUE_SIZE = 100;

    constructor(
        localPort: number = 57121,
        remoteAddress: string = '127.0.0.1',
        remotePort: number = 57120,
        ipVersion: 'udp4' | 'udp6' = 'udp4' // Add parameter
    ) {
        // Validate inputs
        if (localPort < 0 || localPort > 65535) {
            throw new Error(`Invalid local port: ${localPort}`);
        }
        if (remotePort < 0 || remotePort > 65535) {
            throw new Error(`Invalid remote port: ${remotePort}`);
        }

        // this.socket = dgram.createSocket('udp4');
        this.socket = dgram.createSocket({ type: ipVersion, reuseAddr: true });
        this.remoteAddress = remoteAddress;
        this.remotePort = remotePort;

        let isReady = false;

        // Bind with error handling
        this.socket.bind(localPort, (err) => {
            if (err) {
                console.error(`Failed to bind to port ${localPort}:`, err);
                throw err;
            } else {
                isReady = true;
            }
        });

        // Listen for incoming messages
        this.socket.on('message', (msg: Buffer) => {
            if (!isReady) return;
            const parsed = this.parseOSCMessage(msg);
            if (parsed) {
                if (this.onMessageCallback) {
                    this.onMessageCallback(parsed.address, parsed.args);
                } else if (this.messageQueue.length < this.MAX_QUEUE_SIZE) {
                    // Queue messages until callback is set
                    this.messageQueue.push(parsed);
                } else {
                    console.warn('Message queue full, dropping message.')
                }
            }
        });

        this.socket.on('error', (err: Error) => {
            console.error('OSC Socket Error:', err);
            throw err;
        });
    }

    // Set callback for received messages
    onMessage(callback: (address: string, args: OSCValue[]) => void) {
        this.onMessageCallback = callback;

        // Process queued messages
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            if (msg) {
                callback(msg.address, msg.args);
            }
        }
    }

    // Send OSC message
    sendMessage(
        address: string,
        args: OSCValue[] = [],
        errorCallback?: (err: Error) => void
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Socket is closed'));
                return;
            }
            try {
                const message = this.encodeOSCMessage(address, args);
                this.socket.send(message, this.remotePort, this.remoteAddress, (err) => {
                    if (err) {
                        console.error('OSC Send Error:', err);
                        if (errorCallback) errorCallback(err);
                        reject(err);
                    } else {
                        resolve();
                    }
                });
            } catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                console.error('OSC Encode Error:', error);
                if (errorCallback) errorCallback(error);
                reject(error);
            }
        });
    }

    // Encode OSC message
    private encodeOSCMessage(address: string, args: OSCValue[]): Buffer {
        if (!address.startsWith('/') || !/^[\x00-\x7F]*$/.test(address)) {
            throw new Error(`Invalid OSC address: must be ASCII and start with '/'`);
        }
        const padString = (str: string): Buffer => {
            const buf = Buffer.from(str + '\0');
            const padding = 4 - (buf.length % 4);
            return Buffer.concat([buf, Buffer.alloc(padding === 4 ? 0 : padding)]);
        };

        // Encode address
        const addressBuf = padString(address);

        // Build type tags
        const typeTags = ',' + args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                if (arg.type === 'int') return 'i';
                if (arg.type === 'float') return 'f';
            }
            if (typeof arg === 'number') {
                return Number.isInteger(arg) ? 'i' : 'f';
            }
            if (typeof arg === 'string') return 's';
            if (arg === true) return 'T';
            if (arg === false) return 'F';
            if (arg === null) return 'N';
            return '';
        }).join('');
        const typeTagsBuf = padString(typeTags);

        // Encode arguments
        const argBufs = args.map(arg => {
            // Handle explicit type wrappers
            if (typeof arg === 'object' && arg !== null) {
                if (arg.type === 'int') {
                    const buf = Buffer.alloc(4);
                    buf.writeInt32BE(arg.value, 0);
                    return buf;
                }
                if (arg.type === 'float') {
                    const buf = Buffer.alloc(4);
                    buf.writeFloatBE(arg.value, 0);
                    return buf;
                }
            }

            if (typeof arg === 'number') {
                const buf = Buffer.alloc(4); // Changed from allocUnsafe
                if (Number.isInteger(arg)) {
                    if (arg > 2147483647 || arg < -2147483648) {
                        throw new Error(`Integer ${arg} out of int32 range`);
                    }
                    buf.writeInt32BE(arg, 0);
                } else {
                    buf.writeFloatBE(arg, 0);
                }
                return buf;
            } else if (typeof arg === 'string') {
                return padString(arg);
            } else if (arg === true || arg === false || arg === null) {
                // T, F, N have no data bytes
                return Buffer.alloc(0);
            }
            return Buffer.alloc(0);
        });

        return Buffer.concat([addressBuf, typeTagsBuf, ...argBufs]);
    }

    // Parse OSC message
    private parseOSCMessage(buffer: Buffer): { address: string; args: OSCValue[] } | null {
        try {
            // Check for OSC bundle
            if (buffer.length >= 8 && buffer.toString('utf8', 0, 8) === '#bundle\0') {
                console.warn('OSC bundles are not yet supported');
                return null;
            }

            let offset = 0;

            // Read address (null-terminated string, padded to 4 bytes)
            const addressEnd = buffer.indexOf(0, offset);
            if (addressEnd === -1) return null;
            const address = buffer.toString('utf8', offset, addressEnd);
            offset = addressEnd + 1;
            // Skip padding
            while (offset % 4 !== 0) offset++;

            // Read type tags (starts with ',', null-terminated, padded to 4 bytes)
            const typeTagsEnd = buffer.indexOf(0, offset);
            if (typeTagsEnd === -1) return null;
            const typeTags = buffer.toString('utf8', offset + 1, typeTagsEnd); // Skip ','
            offset = typeTagsEnd + 1;
            // Skip padding
            while (offset % 4 !== 0) offset++;

            // Parse arguments based on type tags
            const args: OSCValue[] = [];
            for (const tag of typeTags) {
                if (tag === 'i') {
                    // Integer (4 bytes)
                    if (offset + 4 > buffer.length) break;
                    const value = buffer.readInt32BE(offset);
                    args.push({ type: 'int', value });
                    offset += 4;
                } else if (tag === 'f') {
                    // Float (4 bytes)
                    if (offset + 4 > buffer.length) break;
                    const value = buffer.readFloatBE(offset);
                    args.push({ type: 'float', value });
                    offset += 4;
                } else if (tag === 's') {
                    // String (null-terminated, padded to 4 bytes)
                    const stringEnd = buffer.indexOf(0, offset);
                    if (stringEnd === -1) break;
                    const value = buffer.toString('utf8', offset, stringEnd);
                    args.push(value);
                    offset = stringEnd + 1;
                    // Skip padding
                    while (offset % 4 !== 0) offset++;
                } else if (tag === 'T') {
                    // True (no data)
                    args.push(true as any);
                } else if (tag === 'F') {
                    // False (no data)
                    args.push(false as any);
                } else if (tag === 'N') {
                    // Null (no data)
                    args.push(null as any);
                } else if (tag === 'b') {
                    // Blob (4 byte size + data, padded to 4 bytes)
                    if (offset + 4 > buffer.length) break;
                    const size = buffer.readInt32BE(offset);
                    offset += 4;
                    if (offset + size > buffer.length) break;
                    const blob = buffer.slice(offset, offset + size);
                    args.push(blob.toString('base64')); // Convert blob to base64 string
                    offset += size;
                    // Skip padding
                    while (offset % 4 !== 0) offset++;
                } else {
                    console.warn(`Unsupported OSC type tag: ${tag}`);
                }
            }

            return { address, args };
        } catch (err) {
            console.error('Error parsing OSC message:', err);
            return null;
        }
    }

    close() {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.close();
        }
    }
}

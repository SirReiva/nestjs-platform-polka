import { ServerResponse } from 'http';
import { Readable } from 'stream';

declare function send(res: ServerResponse, code?: number, data?: Buffer|object|Readable|string, headers?: object): void;

export = send;

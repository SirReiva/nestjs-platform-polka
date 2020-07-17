import { AbstractHttpAdapter } from '@nestjs/core/adapters/http-adapter';
import { NestApplicationOptions, RequestMethod } from '@nestjs/common';
import { RouterMethodFactory } from '@nestjs/core/helpers/router-method-factory';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { NestPolkaApplication } from './interface';

import * as http from 'http';
import * as https from 'https';
import polka, { Polka } from 'polka';
import send from '@polka/send-type';
import { default as sirv, Options as SirvOptions } from 'sirv';
import cors from 'cors';
import { json, urlencoded } from 'body-parser';

export interface SirvNestOptions extends SirvOptions {
    prefix?: string;
}

export class PolkaAdapter extends AbstractHttpAdapter {
    private readonly routerMethodFactory = new RouterMethodFactory();

    constructor(instance?: any) {
        super(instance ?? polka())
    }

    reply(response: http.ServerResponse, body: any, statusCode?: number) {
        return send(response, statusCode ?? 200, body);
    }

    close(): Promise<void> {
        if (!this.httpServer) {
            return undefined;
        }

        return new Promise(resolve => this.httpServer.close(resolve));
    }

    initHttpServer(options: NestApplicationOptions) {
        const isHttpsEnabled = options.httpsOptions;
        if (isHttpsEnabled) {
            this.httpServer = https.createServer(
                options.httpsOptions,
                this.getInstance().handler,
            );
            return;
        }
        this.httpServer = http.createServer(this.getInstance().handler);

        this.getInstance().server = this.httpServer;
    }

    useStaticAssets(path: string, options: SirvNestOptions) {
        const serve = sirv(path, options);
        if (options?.prefix) {
            return this.use(options.prefix, serve);
        }

        return this.use(serve);
    }

    setViewEngine(engine: string) {
        throw new Error("Method not implemented.");
    }

    getRequestHostname(req: polka.Request) {
        return req.headers.x_forwarded_host ?? req.headers.host;
    }

    getRequestMethod(request: polka.Request) {
        return request.method;
    }

    getRequestUrl(request: polka.Request) {
        return request.url;
    }

    status(response: http.ServerResponse, statusCode: number) {
        response.statusCode = statusCode;
    }

    render(response: http.ServerResponse, view: string, options: any) {
        throw new Error("Method not implemented.");
    }

    redirect(response: http.ServerResponse, statusCode: number, url: string) {
        response.statusCode = statusCode;
        response.setHeader('Location', url);
        response.end();
    }

    setErrorHandler(handler: Function, prefix?: string) {
        if (prefix) {
            return this.use(prefix, handler);
        }

        this.use(handler);
    }

    setNotFoundHandler(handler: Function, prefix?: string) {
        if (prefix) {
            return this.use(prefix, handler);
        }

        this.use(handler);
    }

    setHeader(response: http.ServerResponse, name: string, value: string) {
        response.setHeader(name, value);
    }

    registerParserMiddleware(prefix?: string) {
        if (prefix) {
            this.use(prefix, json);
            return this.use(prefix, urlencoded({ extended: true }));
        }

        this.use(json);
        this.use(urlencoded({ extended: true }));
    }

    enableCors(options: CorsOptions, prefix?: string) {
        let mw = cors(options);
        if (prefix) {
            return this.use(prefix, mw);
        }
        return this.use(mw);
    }

    createMiddlewareFactory(requestMethod: RequestMethod): (path: string, callback: Function) => any {
        return this.routerMethodFactory.get(this.instance, requestMethod).bind(this.instance);
    }

    getType(): string {
        return 'polka';
    }
}

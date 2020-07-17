import { INestApplication } from '@nestjs/common';
import { Polka } from 'polka';

export interface NestPolkaApplication extends INestApplication {
    getInstance(): Polka;
}

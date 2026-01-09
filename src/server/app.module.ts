import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AuthModule } from './auth.module';
import { BusinessModule } from './business.module';
import { TestsModule } from './tests.module';
import { AdminModule } from './admin.module';

// --- Health Controller (Basic) ---
import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller('health')
class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}
  @Get()
  check() {
    return { 
      status: this.connection.readyState === 1 ? 'CONNECTED' : 'ERROR', 
      timestamp: new Date() 
    };
  }
}

@Module({
  imports: [
    // Configuration Env
    ConfigModule.forRoot({ isGlobal: true }),
    
    // Base de données
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        dbName: 'labobeton',
      }),
      inject: [ConfigService],
    }),

    // Rate Limiting (100 req / 15min approx)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),

    // Frontend Static Serving (Production)
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'dist'),
      exclude: ['/api/(.*)'], // Ne pas intercepter les routes API
    }),

    // Feature Modules
    AuthModule,
    BusinessModule,
    TestsModule,
    AdminModule
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
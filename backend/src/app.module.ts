import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { HealthController } from './health/health.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProjectsModule } from './projects/projects.module';
import { FilesModule } from './files/files.module';
import { ParsingModule } from './parsing/parsing.module';
import { AiProvidersModule } from './ai-providers/ai-providers.module';



@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
     UsersModule,
      AuthModule,
    ProjectsModule,
     FilesModule,
      ParsingModule,
      AiProvidersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { IpfsModule } from './ipfs/ipfs.module';

@Module({
  imports: [IpfsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

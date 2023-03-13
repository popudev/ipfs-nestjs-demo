import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { IpfsController } from './ipfs.controller';

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
  ],
  controllers: [IpfsController],
})
export class IpfsModule {}

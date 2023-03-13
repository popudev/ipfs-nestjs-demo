import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import { create, IPFSHTTPClient } from 'ipfs-http-client';

@Controller('ipfs')
export class IpfsController {
  private readonly ipfsClient: IPFSHTTPClient;

  constructor() {
    this.ipfsClient = create({ url: 'http://127.0.0.1:5001/api/v0' });
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file) {
    if (!file) {
      throw new Error('No file uploaded');
    }
    const stream = createReadStream(file.path);
    const result = await this.ipfsClient.add(stream);
    console.log({ hash: result.cid.toString() });
    return { hash: result.cid.toString() };
  }

  @Get('cid/:id')
  async receiveData(@Param('id') id: string) {
    const asyncArr = this.ipfsClient.get(id);
    for await (const iterator of asyncArr) {
      const data = Buffer.from(iterator).toString('base64');
      const mimeType = 'image/png';
      return `<img src="data:${mimeType};base64,${data}" />`;
    }
  }
}

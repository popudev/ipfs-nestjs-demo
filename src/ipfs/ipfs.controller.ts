import {
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { create, IPFSHTTPClient } from 'ipfs-http-client';

import * as fs from 'fs';
import * as crypto from 'crypto';
import * as stream from 'stream';

const walletPath = './src/ipfs/wallet';

@Controller('ipfs')
export class IpfsController {
  private readonly ipfsClient: IPFSHTTPClient;

  constructor() {
    this.ipfsClient = create({ url: 'http://192.168.1.102:5001/api/v0' });
    this.setup();
  }
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const fileEncrypted = await this.encryptFile(file.path);

    const result = await this.ipfsClient.add(fileEncrypted);

    return { hash: result.cid.toString() };
  }

  @Get('cid/:id')
  async receiveData(@Param('id') id: string) {
    const asyncArr = this.ipfsClient.cat(id);
    const fileContent: Uint8Array[] = [];
    for await (const chunk of asyncArr) {
      fileContent.push(chunk);
    }
    const fileEncrypt = Buffer.concat(fileContent);
    this.decryptFile(fileEncrypt);
  }

  encryptFile(filePath) {
    function getCipherKey(password) {
      return crypto.createHash('sha256').update(password).digest();
    }

    const encryptedData = crypto.createCipheriv(
      'aes-256-cbc',
      getCipherKey('hello'),
      Buffer.alloc(16, 0),
    );

    const fileSt = fs.createReadStream(filePath);
    const outSt = fs.createWriteStream('temp.json');

    const fileStream = fileSt.pipe(encryptedData);

    fileStream.pipe(outSt);

    return fileStream;
  }

  decryptFile(fileEncrypt: Buffer) {
    // Get private key
    const privateKey = fs.readFileSync(walletPath + '/server_key');

    // // Get encrypt the symmetric key
    // const encryptedKey = fs.readFileSync(walletPath + '/symmetric_key');

    // // Decrypt the symmetric key with the private key
    // // const decryptedKey = crypto.privateDecrypt(privateKey, encryptedKey);

    // const initVector = crypto.randomBytes(16);
    const fileStr = stream.Readable.from(fileEncrypt);

    const outSt = fs.createWriteStream('tempD.json');

    function getCipherKey(password) {
      return crypto.createHash('sha256').update(password).digest();
    }

    // Decrypt the file with the symmetric key
    const decryptedData = crypto.createDecipheriv(
      'aes-256-cbc',
      getCipherKey('hello'),
      Buffer.alloc(16, 0),
    );

    fileStr.pipe(decryptedData).pipe(outSt);
  }

  setup() {
    if (fs.existsSync(walletPath)) return;

    // The `generateKeyPairSync` method accepts two arguments:
    // 1. The type ok keys we want, which in this case is "rsa"
    // 2. An object with the properties of the key
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    // Generate a new random symmetric key
    const symmetricKey = crypto.randomBytes(32);

    // Encrypt the symmetric key with the public key
    const encryptedSymmetricKey = crypto.publicEncrypt(publicKey, symmetricKey);

    fs.mkdirSync(walletPath);
    fs.writeFileSync(walletPath + '/server_key', privateKey);
    fs.writeFileSync(walletPath + '/server_key.pub', publicKey);
    fs.writeFileSync(walletPath + '/symmetric_key', encryptedSymmetricKey);
  }
}

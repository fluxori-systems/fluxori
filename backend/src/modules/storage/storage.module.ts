import { Module } from '@nestjs/common';

import { PimStorageController } from './controllers/pim-storage.controller';
import { StorageController } from './controllers/storage.controller';
import { GoogleCloudStorageService } from '../../common/storage/google-cloud-storage.service';
import { STORAGE_SERVICE } from '../../common/storage/storage.interface';

@Module({
  controllers: [StorageController, PimStorageController],
  providers: [
    {
      provide: STORAGE_SERVICE,
      useClass: GoogleCloudStorageService,
    },
  ],
  exports: [STORAGE_SERVICE],
})
export class StorageModule {}

import { Module } from '@nestjs/common';
import { StorageController } from './controllers/storage.controller';
import { PimStorageController } from './controllers/pim-storage.controller';
import { STORAGE_SERVICE } from '../../common/storage/storage.interface';
import { GoogleCloudStorageService } from '../../common/storage/google-cloud-storage.service';

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

import { Module } from "@nestjs/common";
import { StorageController } from "./controllers/storage.controller";
import { PimStorageController } from "./controllers/pim-storage.controller";
import { STORAGE_SERVICE, GoogleCloudStorageService } from "@common/storage";

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

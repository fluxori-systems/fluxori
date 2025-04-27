import { Controller, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";

/**
 * Stub controller for regional warehouse endpoints
 */
@UseGuards(FirebaseAuthGuard)
@Controller("pim/regional-warehouse")
export class RegionalWarehouseController {}

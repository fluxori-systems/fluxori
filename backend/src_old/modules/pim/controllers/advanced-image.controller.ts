import { Controller, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";

/**
 * Stub controller for advanced-image operations
 */
@UseGuards(FirebaseAuthGuard)
@Controller("pim/advanced-image")
export class AdvancedImageController {}

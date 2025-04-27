import { Controller, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";

/**
 * Stub controller for mobile-optimized PIM endpoints
 */
@UseGuards(FirebaseAuthGuard)
@Controller("pim/mobile")
export class MobileFirstController {}

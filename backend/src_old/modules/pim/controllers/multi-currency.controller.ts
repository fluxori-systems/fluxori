import { Controller, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";

/**
 * Stub controller for multi-currency operations in PIM module
 */
@UseGuards(FirebaseAuthGuard)
@Controller("pim/multi-currency")
export class MultiCurrencyController {}

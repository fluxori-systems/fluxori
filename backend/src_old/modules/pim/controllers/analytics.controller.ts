import { Controller, UseGuards } from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";

/**
 * Stub controller for PIM analytics endpoints
 */
@UseGuards(FirebaseAuthGuard)
@Controller("pim/analytics")
export class AnalyticsController {}

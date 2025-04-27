import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { FirebaseAuthGuard } from "@common/guards";
import { GetUser } from "@common/decorators";

/**
 * Stub controller for product bundles
 */
@UseGuards(FirebaseAuthGuard)
@Controller("pim/bundles")
export class BundleController {
  @Post()
  async createBundle(@Body() _dto: any, @GetUser() _user: any): Promise<any> {
    return {};
  }

  @Get(":id")
  async getBundle(
    @Param("id") _id: string,
    @GetUser() _user: any,
  ): Promise<any> {
    return null;
  }

  @Get()
  async getAllBundles(
    @Query() _query: any,
    @GetUser() _user: any,
  ): Promise<any[]> {
    return [];
  }

  @Put(":id")
  async updateBundle(
    @Param("id") _id: string,
    @Body() _dto: any,
    @GetUser() _user: any,
  ): Promise<any> {
    return {};
  }

  @Delete(":id")
  async deleteBundle(
    @Param("id") _id: string,
    @GetUser() _user: any,
  ): Promise<void> {
    return;
  }
}

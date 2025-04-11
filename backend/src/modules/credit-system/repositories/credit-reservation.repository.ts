import { Injectable } from "@nestjs/common";

import { FirestoreBaseRepository } from "../../../common/repositories/firestore-base.repository";
import { FirestoreConfigService } from "../../../config/firestore.config";
import { CreditReservation, CreditUsageType } from "../interfaces/types";

/**
 * Repository for credit reservations
 */
@Injectable()
export class CreditReservationRepository extends FirestoreBaseRepository<CreditReservation> {
  protected readonly collectionName = "credit_reservations";

  constructor(firestoreConfigService: FirestoreConfigService) {
    super(firestoreConfigService, "credit_reservations", {
      useVersioning: true,
      enableCache: true,
      cacheTTLMs: 1 * 60 * 1000, // 1 minute (reservations change frequently)
      requiredFields: [
        "organizationId",
        "operationId",
        "reservationAmount",
        "usageType",
        "status",
        "expirationDate",
      ],
    });
  }

  /**
   * Find active reservations by organization
   * @param organizationId Organization ID
   * @returns Array of active reservations
   */
  async findActiveByOrganization(
    organizationId: string,
  ): Promise<CreditReservation[]> {
    const now = new Date();
    
    // Get reservations for the organization
    const reservations = await this.find({
      filter: { 
        organizationId,
        status: "pending",
      } as Partial<CreditReservation>,
    });
    
    // Filter out expired reservations
    return reservations.filter((reservation) => {
      const expirationDate = reservation.expirationDate instanceof Date 
        ? reservation.expirationDate 
        : new Date(reservation.expirationDate);
      
      return expirationDate > now;
    });
  }

  /**
   * Find reservation by operation ID
   * @param operationId Operation ID
   * @returns Reservation or null if not found
   */
  async findByOperationId(operationId: string): Promise<CreditReservation | null> {
    const reservations = await this.find({
      filter: { operationId } as Partial<CreditReservation>,
    });
    
    return reservations.length > 0 ? reservations[0] : null;
  }

  /**
   * Find active reservations for a user
   * @param organizationId Organization ID
   * @param userId User ID
   * @returns Array of active reservations
   */
  async findActiveByUser(
    organizationId: string,
    userId: string,
  ): Promise<CreditReservation[]> {
    const now = new Date();
    
    // Get reservations for the user
    const reservations = await this.find({
      filter: { 
        organizationId,
        userId,
        status: "pending",
      } as Partial<CreditReservation>,
    });
    
    // Filter out expired reservations
    return reservations.filter((reservation) => {
      const expirationDate = reservation.expirationDate instanceof Date 
        ? reservation.expirationDate 
        : new Date(reservation.expirationDate);
      
      return expirationDate > now;
    });
  }

  /**
   * Get total reserved credits for an organization
   * @param organizationId Organization ID
   * @returns Total reserved credits
   */
  async getTotalReserved(organizationId: string): Promise<number> {
    const now = new Date();
    
    // Get active reservations for the organization
    const reservations = await this.find({
      filter: { 
        organizationId,
        status: "pending",
      } as Partial<CreditReservation>,
    });
    
    // Filter out expired reservations and sum the amounts
    return reservations
      .filter((reservation) => {
        const expirationDate = reservation.expirationDate instanceof Date 
          ? reservation.expirationDate 
          : new Date(reservation.expirationDate);
        
        return expirationDate > now;
      })
      .reduce((total, reservation) => {
        return total + reservation.reservationAmount;
      }, 0);
  }

  /**
   * Update specific fields of an entity
   * @param id Entity ID
   * @param fields Fields to update
   * @returns Updated entity
   */
  async updateFields(
    id: string,
    fields: Partial<CreditReservation>,
  ): Promise<CreditReservation> {
    return this.update(id, fields);
  }

  /**
   * Update reservation status
   * @param reservationId Reservation ID
   * @param status New status
   * @returns Updated reservation
   */
  async updateStatus(
    reservationId: string,
    status: "confirmed" | "released" | "expired",
  ): Promise<CreditReservation> {
    return this.updateFields(reservationId, {
      status,
    });
  }

  /**
   * Clean up expired reservations
   * @returns Number of reservations cleaned up
   */
  async cleanupExpired(): Promise<number> {
    const now = new Date();
    
    // Get expired reservations
    const reservations = await this.find({
      filter: { status: "pending" } as Partial<CreditReservation>,
    });
    
    const expiredReservations = reservations.filter((reservation) => {
      const expirationDate = reservation.expirationDate instanceof Date 
        ? reservation.expirationDate 
        : new Date(reservation.expirationDate);
      
      return expirationDate <= now;
    });
    
    // Update the status of expired reservations
    const updatePromises = expiredReservations.map((reservation) => {
      return this.updateFields(reservation.id, {
        status: "expired",
      });
    });
    
    await Promise.all(updatePromises);
    
    return expiredReservations.length;
  }

  /**
   * Find reservations by usage type
   * @param organizationId Organization ID
   * @param usageType Usage type
   * @returns Array of reservations
   */
  async findByUsageType(
    organizationId: string,
    usageType: CreditUsageType,
  ): Promise<CreditReservation[]> {
    return this.find({
      filter: { 
        organizationId,
        usageType,
      } as Partial<CreditReservation>,
    });
  }
}
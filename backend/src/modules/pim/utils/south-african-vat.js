"use strict";
/**
 * South African VAT Rate Management
 *
 * This utility manages VAT rates according to South African tax regulations,
 * including the 2025 National Budget-announced rate changes:
 * - Current rate: 15.0% (until April 30, 2025)
 * - First increase: 15.5% (May 1, 2025 to March 31, 2026)
 * - Second increase: 16.0% (from April 1, 2026)
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SouthAfricanVat = void 0;
/**
 * Utility class for South African VAT calculations
 */
var SouthAfricanVat = /** @class */ (function () {
    function SouthAfricanVat() {
    }
    /**
     * Get the applicable VAT rate for a specific date
     *
     * @param date The date to check (defaults to current date)
     * @returns The applicable VAT rate schedule
     */
    SouthAfricanVat.getVatRateForDate = function (date) {
        if (date === void 0) { date = new Date(); }
        var applicableRate = this.VAT_RATES.find(function (rate) {
            return date >= rate.validFrom &&
                (!rate.validTo || date <= rate.validTo);
        });
        if (!applicableRate) {
            // Fallback to the latest rate if no match found
            return this.VAT_RATES[this.VAT_RATES.length - 1];
        }
        return applicableRate;
    };
    /**
     * Get all VAT rates
     *
     * @returns Array of all VAT rate schedules
     */
    SouthAfricanVat.getAllVatRates = function () {
        return __spreadArray([], this.VAT_RATES, true);
    };
    /**
     * Calculate VAT for a price excluding VAT
     *
     * @param priceExcludingVat The price excluding VAT
     * @param date The date to use for VAT rate determination
     * @returns VAT calculation result
     */
    SouthAfricanVat.calculateVat = function (priceExcludingVat, date) {
        if (date === void 0) { date = new Date(); }
        var vatSchedule = this.getVatRateForDate(date);
        var vatRate = vatSchedule.rate;
        var vatAmount = priceExcludingVat * vatRate;
        var priceIncludingVat = priceExcludingVat + vatAmount;
        return {
            vatRate: vatRate,
            vatRatePercentage: vatRate * 100,
            vatAmount: vatAmount,
            priceExcludingVat: priceExcludingVat,
            priceIncludingVat: priceIncludingVat,
            rateScheduleInfo: {
                validFrom: vatSchedule.validFrom,
                validTo: vatSchedule.validTo,
                description: vatSchedule.description
            }
        };
    };
    /**
     * Calculate price excluding VAT from a price including VAT
     *
     * @param priceIncludingVat The price including VAT
     * @param date The date to use for VAT rate determination
     * @returns VAT calculation result
     */
    SouthAfricanVat.removeVat = function (priceIncludingVat, date) {
        if (date === void 0) { date = new Date(); }
        var vatSchedule = this.getVatRateForDate(date);
        var vatRate = vatSchedule.rate;
        var priceExcludingVat = priceIncludingVat / (1 + vatRate);
        var vatAmount = priceIncludingVat - priceExcludingVat;
        return {
            vatRate: vatRate,
            vatRatePercentage: vatRate * 100,
            vatAmount: vatAmount,
            priceExcludingVat: priceExcludingVat,
            priceIncludingVat: priceIncludingVat,
            rateScheduleInfo: {
                validFrom: vatSchedule.validFrom,
                validTo: vatSchedule.validTo,
                description: vatSchedule.description
            }
        };
    };
    /**
     * Generate VAT rate changes breakdown for a price
     *
     * @param price The price (excluding VAT)
     * @param includesVat Whether the price already includes VAT
     * @returns Array of VAT calculations for all rate periods
     */
    SouthAfricanVat.getVatRateChangesBreakdown = function (price, includesVat) {
        var _this = this;
        if (includesVat === void 0) { includesVat = false; }
        return this.VAT_RATES.map(function (ratePeriod) {
            var midpointDate = _this.getMidpointDate(ratePeriod.validFrom, ratePeriod.validTo);
            if (includesVat) {
                return _this.removeVat(price, midpointDate);
            }
            else {
                return _this.calculateVat(price, midpointDate);
            }
        });
    };
    /**
     * Helper method to get a midpoint date between two dates
     *
     * @param startDate The start date
     * @param endDate The end date (optional)
     * @returns The midpoint date
     */
    SouthAfricanVat.getMidpointDate = function (startDate, endDate) {
        if (!endDate) {
            // If no end date, use a date far in the future for the current rate
            var futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 10);
            endDate = futureDate;
        }
        var midpointTime = (startDate.getTime() + endDate.getTime()) / 2;
        return new Date(midpointTime);
    };
    // VAT rate schedule with implementation of announced changes
    SouthAfricanVat.VAT_RATES = [
        {
            rate: 0.15, // 15.0%
            validFrom: new Date('1900-01-01'), // Default historical rate
            validTo: new Date('2025-04-30T23:59:59.999Z'),
            description: 'Standard VAT rate until April 30, 2025'
        },
        {
            rate: 0.155, // 15.5%
            validFrom: new Date('2025-05-01T00:00:00.000Z'),
            validTo: new Date('2026-03-31T23:59:59.999Z'),
            description: 'VAT rate from May 1, 2025 to March 31, 2026'
        },
        {
            rate: 0.16, // 16.0%
            validFrom: new Date('2026-04-01T00:00:00.000Z'),
            validTo: undefined, // No end date for latest rate
            description: 'VAT rate from April 1, 2026 onwards'
        }
    ];
    return SouthAfricanVat;
}());
exports.SouthAfricanVat = SouthAfricanVat;

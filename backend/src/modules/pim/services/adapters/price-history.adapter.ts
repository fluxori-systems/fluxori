import { PriceHistoryRecord } from '../../models/price-history.model';
import { Timestamp } from '@google-cloud/firestore';

/**
 * Transforms a raw Firestore PriceHistoryRecord (with possible Timestamp fields)
 * into a domain PriceHistoryRecord (with JS Date objects).
 */
export function mapRawPriceHistoryRecord(
  raw: PriceHistoryRecord
): PriceHistoryRecord {
  const toDate = (v: any): Date | undefined | null => {
    if (v instanceof Timestamp) return v.toDate();
    return v as Date | undefined | null;
  };

  return {
    ...raw,
    createdAt: toDate(raw.createdAt) as Date,
    updatedAt: toDate(raw.updatedAt) as Date,
    deletedAt: raw.deletedAt !== undefined ? toDate(raw.deletedAt) : undefined,
    recordedAt: raw.recordedAt !== undefined ? toDate(raw.recordedAt) : undefined,
  };
}

/**
 * Maps an array of raw records.
 */
export function mapRawPriceHistoryRecords(
  raws: PriceHistoryRecord[]
): PriceHistoryRecord[] {
  return raws.map(mapRawPriceHistoryRecord);
}

/**
 * Maps a grouped record set (by productId).
 */
export function mapGroupedRawPriceHistoryRecords(
  groups: Record<string, PriceHistoryRecord[]>
): Record<string, PriceHistoryRecord[]> {
  const result: Record<string, PriceHistoryRecord[]> = {};
  Object.keys(groups).forEach((key) => {
    result[key] = groups[key].map(mapRawPriceHistoryRecord);
  });
  return result;
}

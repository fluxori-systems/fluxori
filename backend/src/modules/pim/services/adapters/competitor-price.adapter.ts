import { Timestamp } from '@google-cloud/firestore';
import { CompetitorPrice } from '../../models/competitor-price.model';

/**
 * Transforms a raw Firestore CompetitorPrice (with possible Timestamp fields)
 * into a domain CompetitorPrice (with JS Date objects).
 */
export function mapRawCompetitorPrice(
  raw: CompetitorPrice
): CompetitorPrice {
  const toDate = (v: any): Date | undefined | null => {
    if (v instanceof Timestamp) return v.toDate();
    return v as Date | undefined | null;
  };

  return {
    ...raw,
    createdAt: toDate(raw.createdAt) as Date,
    updatedAt: toDate(raw.updatedAt) as Date,
    deletedAt: raw.deletedAt !== undefined ? toDate(raw.deletedAt) : undefined,
  };
}

/**
 * Maps an array of raw competitor prices.
 */
export function mapRawCompetitorPrices(
  raws: CompetitorPrice[]
): CompetitorPrice[] {
  return raws.map(mapRawCompetitorPrice);
}

/**
 * Maps grouped competitor prices.
 */
export function mapGroupedRawCompetitorPrices(
  groups: Record<string, CompetitorPrice[]>
): Record<string, CompetitorPrice[]> {
  const result: Record<string, CompetitorPrice[]> = {};
  Object.keys(groups).forEach((key) => {
    result[key] = groups[key].map(mapRawCompetitorPrice);
  });
  return result;
}

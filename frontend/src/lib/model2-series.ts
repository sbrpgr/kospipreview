type Model2SeriesRecord = {
  predictionDateIso?: string | null;
  observedAt: string;
  clockSyncUsed?: boolean;
};

export function selectActiveModel2Records<T extends Model2SeriesRecord>(records: T[], targetDate?: string | null): T[] {
  if (!targetDate) {
    return [];
  }

  const targetRecords = records.filter((record) => record.predictionDateIso === targetDate);
  const hasClockSyncedRecords = targetRecords.some((record) => record.clockSyncUsed === true);

  if (!hasClockSyncedRecords) {
    return targetRecords;
  }

  return targetRecords.filter((record) => record.clockSyncUsed === true);
}

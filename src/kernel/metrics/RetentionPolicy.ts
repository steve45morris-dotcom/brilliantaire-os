import { globalStorageAdapter } from './StorageAdapter.js';

export class RetentionPolicy {
  private retentionDays = 30;

  public enforce(): number {
    const records = globalStorageAdapter.read();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.retentionDays);

    const filtered = records.filter(r => {
      const recordDate = new Date(r.timestamp);
      return recordDate >= cutoffDate;
    });

    const deletedCount = records.length - filtered.length;
    if (deletedCount > 0) {
      globalStorageAdapter.writeAll(filtered);
    }
    return deletedCount;
  }
}

export const globalRetentionPolicy = new RetentionPolicy();

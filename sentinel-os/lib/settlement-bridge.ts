import { runExecute, runQuery } from "./db";
import { signEvent } from "./zk-ledger";

export interface SettlementResult {
  success: boolean;
  licenseId: number;
  signedHash: string;
}

export async function processMicroAgentSettlement(
  clientName: string,
  platformName: string,
  amountPaid: number,
  licenseKey: string
): Promise<SettlementResult> {
  const lastContact = new Date().toISOString();
  
  // 1. Insert license record into sales_ledger
  await runExecute(`
    INSERT INTO sales_ledger (target_name, target_platform, status, last_contact, notes, subscription_status)
    VALUES ('${clientName}', '${platformName}', 'ACTIVE', '${lastContact}', 'License assigned: ${licenseKey}, settled: $${amountPaid}', 'active');
  `);
  
  const lastSalesRow = await runQuery("SELECT last_insert_rowid() as id;");
  const salesId = lastSalesRow.length > 0 
    ? (Array.isArray(lastSalesRow[0]) ? Number(lastSalesRow[0][0]) : Number(lastSalesRow[0].id))
    : 0;

  // 2. Insert transaction ledger entry into sovereign_ledger
  await runExecute(`
    INSERT INTO sovereign_ledger (category, action, status, detail)
    VALUES ('SETTLEMENT', 'LICENSING', 'SUCCESS', 'Settled transaction of $${amountPaid} for client ${clientName} on platform ${platformName}');
  `);

  const lastSovereignRow = await runQuery("SELECT last_insert_rowid() as id;");
  const sovereignId = lastSovereignRow.length > 0
    ? (Array.isArray(lastSovereignRow[0]) ? Number(lastSovereignRow[0][0]) : Number(lastSovereignRow[0].id))
    : 0;

  // 3. Cryptographically sign the settlement event in ZK Ledger for tamper protection
  const dataPayload = `sales-${salesId}-sov-${sovereignId}-${clientName}-${amountPaid}`;
  const signedHash = await signEvent("WRITE", salesId, dataPayload);

  return {
    success: true,
    licenseId: salesId,
    signedHash
  };
}

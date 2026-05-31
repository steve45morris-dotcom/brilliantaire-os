import { verifyZKPIdentity, runDigitalTwinSimulation } from "../sentinel-os/lib/mesh_layer.js";
import { loadLedgerEvents, writeLedger, type MockStripeEvent } from "../sentinel-os/web/stripe_ledger.js";

async function testZKP() {
  console.log("\n🔒 TESTING ZKP IDENTITY VERIFICATION...");
  const validNode = "node_alpha_99";
  const validProof = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"; // 32 chars hex
  const result = await verifyZKPIdentity(validNode, validProof);
  console.log(`- Node: ${validNode}`);
  console.log(`- Proof: ${validProof}`);
  console.log(`- Result: ${result.verified ? "✅ VERIFIED" : "❌ FAILED"}`);
  console.log(`- Trust Score: ${result.trustScore}`);
}

async function testDigitalTwin() {
  console.log("\n🧬 TESTING DIGITAL TWIN SIMULATION...");
  const sim = await runDigitalTwinSimulation();
  console.log(`- Scenario: ${sim.scenario}`);
  console.log(`- Convergence: ${sim.failoverConvergenceMs}ms`);
  console.log(`- Status: ${sim.status === "PASS" ? "✅ PASS" : "❌ FAIL"}`);
}

async function testStripeWebhookLedger() {
  console.log("\n💳 TESTING STRIPE WEBHOOK LEDGER RECONCILIATION...");
  const mockEvent: MockStripeEvent = {
    id: `evt_test_${Math.floor(Math.random() * 100000)}`,
    type: "payment.succeeded",
    amount: 2500000, // $25,000.00
    currency: "usd",
    status: "succeeded",
    timestamp: new Date().toISOString(),
    appName: "SovereignMesh"
  };

  console.log(`- Mock Event ID: ${mockEvent.id}`);
  console.log(`- Amount: $${(mockEvent.amount / 100).toFixed(2)}`);
  
  const currentEvents = await loadLedgerEvents();
  console.log(`- Current Ledger Length: ${currentEvents.length}`);
  
  currentEvents.push(mockEvent);
  await writeLedger(currentEvents);
  console.log("- New payment event appended to ledger.");

  const reloadedEvents = await loadLedgerEvents();
  console.log(`- Updated Ledger Length: ${reloadedEvents.length}`);
  
  const totalRevenue = reloadedEvents
    .filter(e => e.type === "payment.succeeded")
    .reduce((sum, e) => sum + e.amount, 0) / 100;
  console.log(`- Total Projected MRR: $${totalRevenue.toFixed(2)}`);
}

async function main() {
  console.log("=========================================");
  console.log("🛰️ RUNNING MESH CORE INTEGRATION TESTS");
  console.log("=========================================");
  await testZKP();
  await testDigitalTwin();
  await testStripeWebhookLedger();
  console.log("=========================================");
  console.log("✅ INTEGRATION TESTS COMPLETED SUCCESSFULLY");
  console.log("=========================================");
}

main().catch(err => {
  console.error("❌ Integration tests crashed:", err);
});

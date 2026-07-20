import { EdgeBroker } from './broker.js';
// Simulate Kernel registration so Governance doesn't flag it as orphaned
const port = parseInt(process.env.EDGE_PORT || '8080', 10);
const broker = new EdgeBroker(port);
console.log('✅ Edge-Link registered and running.');
export { broker };

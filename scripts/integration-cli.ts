import { BootManager } from '../src/kernel/boot/BootManager.js';
import { globalServiceRegistry } from '../src/kernel/registry/ServiceRegistry.js';
import { withLiveSession } from './lib/withLiveSession.js';
import { globalIntegrationFactory } from '../src/integrations/core/IntegrationFactory.js';

const cmd = process.argv[2] || 'list';

async function main() {
  const bootManager = new BootManager();
  await bootManager.boot();

  const uif = globalServiceRegistry.getService('UniversalIntegrationFramework');

  console.log(`[UIF CLI] Command: ${cmd}`);

  await withLiveSession(`integration:${cmd}`, async () => {
    switch (cmd) {
      case 'list': {
        const list = uif.listIntegrations();
        console.log('Registered integrations list:');
        console.log(JSON.stringify(list.map((i: any) => ({
          id: i.id,
          name: i.name,
          status: i.status,
          version: i.version
        })), null, 2));
        break;
      }
      case 'health': {
        const id = process.argv[3] || 'github';
        const integration = uif.getIntegration(id);
        if (!integration) {
          console.log(`Integration "${id}" not found.`);
        } else {
          console.log(`Health status of "${id}":`);
          console.log(JSON.stringify(integration.health, null, 2));
        }
        break;
      }
      case 'sync': {
        const id = process.argv[3] || 'github';
        const integration = uif.getIntegration(id);
        if (!integration) {
          console.log(`Integration "${id}" not found.`);
        } else {
          console.log(`Syncing integration: ${id}`);
          await integration.sync();
          console.log('Sync finished successfully.');
        }
        break;
      }
      case 'status': {
        const id = process.argv[3] || 'github';
        const integration = uif.getIntegration(id);
        if (!integration) {
          console.log(`Integration "${id}" not found.`);
        } else {
          console.log(`Integration status details for "${id}":`);
          console.log(JSON.stringify({
            id: integration.id,
            name: integration.name,
            status: integration.status,
            permissions: integration.permissions,
            authentication: integration.authentication
          }, null, 2));
        }
        break;
      }
      case 'disable': {
        const id = process.argv[3] || 'github';
        uif.disableIntegration(id);
        console.log(`Integration "${id}" status set to disabled.`);
        break;
      }
      case 'register': {
        const id = process.argv[3];
        if (!id) {
          console.log('Usage: npm run integration:register -- <integration-id>');
          console.log('Available plugins:', globalIntegrationFactory.listPlugins().map((p: any) => p.id).join(', ') || 'none');
        } else {
          const contract = globalIntegrationFactory.create(id);
          if (!contract) {
            console.log(`No plugin found for: ${id}`);
          } else {
            uif.registerIntegration(contract);
            console.log(`Integration "${id}" registered successfully.`);
          }
        }
        break;
      }
      default:
        console.log(`Unknown UIF command: ${cmd}`);
    }
  });
}

main().catch(console.error);

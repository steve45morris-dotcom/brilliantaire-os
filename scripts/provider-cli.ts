import { BootManager } from '../src/kernel/boot/BootManager.js';
import { globalServiceRegistry } from '../src/kernel/registry/ServiceRegistry.js';
import { globalIntegrationRegistry } from '../src/integrations/core/IntegrationRegistry.js';
import { globalModelRoutingPolicy } from '../src/integrations/core/ModelRoutingPolicy.js';
import { globalModelRouter } from '../src/integrations/core/ModelRouter.js';
import { TaskRole } from '../src/integrations/core/ModelRoutingTypes.js';
import { globalModelRegistry } from '../src/models/ModelRegistry.js';
import { globalDeprecatedOverrideManager } from '../src/models/ModelSelection.js';
import { withLiveSession } from './lib/withLiveSession.js';

const cmd = process.argv[2] || 'status';

function getArgValue(flag: string): string | null {
  const index = process.argv.indexOf(flag);
  if (index !== -1 && process.argv[index + 1]) {
    if (flag === '--prompt') {
      return process.argv.slice(index + 1).join(' ');
    }
    return process.argv[index + 1];
  }
  return null;
}

async function main() {
  const bootManager = new BootManager();
  await bootManager.boot();

  console.log(`[Provider CLI] Command: ${cmd}`);

  await withLiveSession(`provider:${cmd}`, async () => {
    switch (cmd) {
      case 'list': {
        const integrations = globalIntegrationRegistry.list().filter(i => i.type === 'model-provider');
        console.log('\n--- Registered Model Providers ---');
        console.log(JSON.stringify(integrations.map(i => ({
          id: i.id,
          name: i.name,
          provider: i.provider,
          status: i.status,
          fallbackEligibility: (i as any).fallbackEligibility ?? false,
          capabilities: (i as any).capabilities ?? []
        })), null, 2));
        break;
      }
      
      case 'health': {
        const integrations = globalIntegrationRegistry.list().filter(i => i.type === 'model-provider');
        console.log('\n--- Model Provider Health Status ---');
        const healthMap: Record<string, any> = {};
        for (const i of integrations) {
          // Trigger async health check to populate status
          const health = (i as any).healthCheck ? await (i as any).healthCheck() : (i as any).health;
          healthMap[i.id] = {
            status: health.status,
            latencyMs: health.latencyMs,
            errors: health.errors || [],
            authenticated: health.authenticated,
            message: health.message
          };
        }
        console.log(JSON.stringify(healthMap, null, 2));
        break;
      }

      case 'test-routing': {
        const taskVal = getArgValue('--task') as TaskRole || 'general';
        console.log(`\nTesting routing selection for task type: "${taskVal}"...`);
        
        // Populate cached health state by running checks
        const integrations = globalIntegrationRegistry.list().filter(i => i.type === 'model-provider');
        for (const i of integrations) {
          if ((i as any).healthCheck) {
            await (i as any).healthCheck();
          }
        }

        const routeResult = globalModelRouter.route({
          taskDescription: `Cli test query for role ${taskVal}`,
          taskType: taskVal
        });
        console.log('Routing Decision Result:');
        console.log(JSON.stringify(routeResult, null, 2));
        break;
      }

      case 'test-execute': {
        const taskVal = getArgValue('--task') as TaskRole || 'general';
        const promptVal = getArgValue('--prompt') || 'Hello';
        const providerVal = getArgValue('--provider') || undefined;
        const modelVal = getArgValue('--model') || undefined;
        console.log(`\nExecuting routed request for task type: "${taskVal}" with prompt: "${promptVal}" (Provider: ${providerVal || 'auto'})...`);
        
        // Populate cached health state by running checks
        const integrations = globalIntegrationRegistry.list().filter(i => i.type === 'model-provider');
        for (const i of integrations) {
          if ((i as any).healthCheck) {
            await (i as any).healthCheck();
          }
        }

        const routeResult = await globalModelRouter.executeRoutedRequest({
          taskDescription: promptVal,
          taskType: taskVal,
          selectedProvider: providerVal,
          selectedModel: modelVal,
          requiredCapability: 'text'
        }, {
          requestId: `cli-exec-${Date.now()}`,
          sessionId: 'cli-exec-session',
          workspaceId: 'default-workspace',
          userIntent: promptVal,
          approvalStatus: 'approved',
          allowedTools: []
        });

        console.log('\nExecution Response:');
        console.log(JSON.stringify(routeResult, null, 2));
        break;
      }

      case 'explain-selection': {
        const taskVal = getArgValue('--task') as TaskRole || 'general';
        console.log(`\nTrace Selection Logic for task type: "${taskVal}"`);
        
        // Populate cached health state by running checks
        const integrations = globalIntegrationRegistry.list().filter(i => i.type === 'model-provider');
        for (const i of integrations) {
          if ((i as any).healthCheck) {
            await (i as any).healthCheck();
          }
        }

        const policy = globalModelRoutingPolicy.getSettings();
        const preferred = globalModelRoutingPolicy.getPreferredProviderForRole(taskVal);
        const routeResult = globalModelRouter.route({
          taskDescription: `Cli explain query for role ${taskVal}`,
          taskType: taskVal
        });

        console.log('\n--- Selection Trace Diagnostics ---');
        console.log(JSON.stringify({
          inferredRole: taskVal,
          routingMode: policy.routingMode,
          preferredProviderByPolicy: preferred,
          resolvedProviderId: routeResult.providerId,
          resolvedModel: routeResult.model,
          confidence: routeResult.confidence,
          requiresApproval: routeResult.requiresApproval,
          fallbackActive: !!routeResult.fallbackProviderId,
          fallbackProvider: routeResult.fallbackProviderId || 'None',
          reason: routeResult.reason
        }, null, 2));
        break;
      }

      case 'set-default': {
        const provider = getArgValue('--provider');
        const role = getArgValue('--role') as TaskRole;
        if (!provider || !role) {
          console.error('Error: Both --provider and --role flags are required for set-default.');
          process.exit(1);
        }
        
        const settingsKey = `preferred${role.charAt(0).toUpperCase()}${role.slice(1)}Provider` as any;
        globalModelRoutingPolicy.updateSettings({
          [settingsKey]: provider
        });
        console.log(`Successfully updated preferred provider for role "${role}" to "${provider}".`);
        break;
      }

      case 'verify-credentials': {
        const integrations = globalIntegrationRegistry.list().filter(i => i.type === 'model-provider');
        console.log('\n--- Verifying Provider Credentials ---');
        const results = [];
        for (const i of integrations) {
          const auth = i.authentication;
          // Trigger async healthCheck
          const health = (i as any).healthCheck ? await (i as any).healthCheck() : i.health;
          results.push({
            provider: i.id,
            configured: auth.authenticated ? 'yes' : 'no',
            maskedToken: auth.maskedToken,
            authenticated: auth.authenticated,
            healthState: health.status
          });
        }
        console.log(JSON.stringify(results, null, 2));
        break;
      }

      case 'list-models': {
        const providerFilter = getArgValue('--provider');
        console.log(`\n--- List Models (Filter: ${providerFilter || 'All'}) ---`);
        const integrations = globalIntegrationRegistry.list().filter(i => i.type === 'model-provider');
        const modelMap: Record<string, string[]> = {};
        for (const i of integrations) {
          if (!providerFilter || i.id === providerFilter) {
            const models = (i as any).discoverModels ? await (i as any).discoverModels() : (i as any).listModels();
            modelMap[i.id] = models;
          }
        }
        console.log(JSON.stringify(modelMap, null, 2));
        break;
      }

      case 'validate-models': {
        const allModels = globalModelRegistry.getAllModels();
        console.log('\n--- Validate Models Lifecycle Status ---');
        const validated = allModels.map((m: any) => ({
          modelId: m.id,
          provider: m.provider,
          supported: m.supported,
          deprecated: m.deprecated,
          retirementDate: m.retirementDate || 'N/A',
          overrideActive: globalDeprecatedOverrideManager.isOverrideActive(m.id)
        }));
        console.log(JSON.stringify(validated, null, 2));
        break;
      }

      case 'setup': {
        const readline = await import('node:readline');
        const fs = await import('node:fs');
        const path = await import('node:path');

        console.log('\n----------------------------------------');
        console.log('The One System Secure Provider Setup');
        console.log('----------------------------------------');
        console.log('Available Providers');
        console.log('1. OpenAI');
        console.log('2. Gemini');
        console.log('3. Anthropic');
        console.log('4. GitHub');
        console.log('5. Stripe');
        console.log('6. Cancel');
        console.log('----------------------------------------');

        const rlMenu = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const choice: string = await new Promise((resolve) => {
          rlMenu.question('Select provider: ', (answer) => {
            rlMenu.close();
            resolve(answer.trim());
          });
        });

        if (choice === '6' || choice.toLowerCase() === 'cancel') {
          console.log('Setup cancelled.');
          break;
        }

        let providerName = '';
        let envVarName = '';
        if (choice === '1') {
          providerName = 'OpenAI';
          envVarName = 'OPENAI_API_KEY';
        } else if (choice === '2') {
          providerName = 'Gemini';
          envVarName = 'GEMINI_API_KEY';
        } else if (choice === '3') {
          providerName = 'Anthropic';
          envVarName = 'ANTHROPIC_API_KEY';
        } else if (choice === '4') {
          providerName = 'GitHub';
          envVarName = 'GITHUB_TOKEN';
        } else if (choice === '5') {
          providerName = 'Stripe';
          envVarName = 'STRIPE_SECRET_KEY';
        } else {
          console.log('Invalid selection.');
          break;
        }

        const rlKey = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const query = `Enter ${providerName} key/token: `;
        process.stdout.write(query);

        let muted = false;
        (rlKey as any)._writeToOutput = function _writeToOutput(stringToWrite: string) {
          if (muted) return;
          process.stdout.write(stringToWrite);
        };

        muted = true;
        const keyValue: string = await new Promise((resolve) => {
          rlKey.question('', (answer) => {
            muted = false;
            process.stdout.write('\n');
            rlKey.close();
            resolve(answer.trim());
          });
        });

        if (!keyValue) {
          console.log('No key entered. Setup aborted.');
          break;
        }

        const zshSecretsPath = path.join(process.env.HOME || '/Users/alexanderanthony', '.zsh_secrets');
        let secretsContent = '';
        if (fs.existsSync(zshSecretsPath)) {
          secretsContent = fs.readFileSync(zshSecretsPath, 'utf8');
        }

        const regex = new RegExp(`^(export\\s+)?${envVarName}=.*$`, 'm');
        const newLine = `export ${envVarName}="${keyValue}"`;

        if (regex.test(secretsContent)) {
          secretsContent = secretsContent.replace(regex, newLine);
        } else {
          if (secretsContent && !secretsContent.endsWith('\n')) {
            secretsContent += '\n';
          }
          secretsContent += newLine + '\n';
        }

        fs.writeFileSync(zshSecretsPath, secretsContent, 'utf8');
        try {
          fs.chmodSync(zshSecretsPath, 0o600);
        } catch (err) {
          console.warn(`Could not chmod ~/.zsh_secrets: ${(err as Error).message}`);
        }

        const zshrcPath = path.join(process.env.HOME || '/Users/alexanderanthony', '.zshrc');
        if (fs.existsSync(zshrcPath)) {
          let zshrcContent = fs.readFileSync(zshrcPath, 'utf8');
          if (!zshrcContent.includes('.zsh_secrets')) {
            const appendStr = `\n# Load modular secrets\nif [ -f "$HOME/.zsh_secrets" ]; then\n    source "$HOME/.zsh_secrets"\nfi\n`;
            fs.appendFileSync(zshrcPath, appendStr, 'utf8');
          }
        }

        process.env[envVarName] = keyValue;
        console.log(`\nSuccessfully stored credential for ${providerName} in ~/.zsh_secrets`);

        console.log('\n--- Running Provider Verification ---\n');
        
        const openAIKey = process.env.OPENAI_API_KEY || '';
        const hasOpenAI = !!openAIKey && openAIKey !== 'unconfigured';
        console.log('OpenAI');
        console.log(hasOpenAI ? 'Configured ✓\n' : 'Not Configured ✗\n');

        const geminiKey = process.env.GEMINI_API_KEY || '';
        const hasGemini = !!geminiKey && geminiKey !== 'unconfigured';
        console.log('Gemini');
        console.log(hasGemini ? 'Configured ✓\n' : 'Not Configured ✗\n');

        const githubToken = process.env.GITHUB_TOKEN || '';
        const hasGitHub = !!githubToken && githubToken !== 'unconfigured';
        console.log('GitHub');
        console.log(hasGitHub ? 'Configured ✓\n' : 'Not Configured ✗\n');

        break;
      }

      case 'secret-scan': {
        console.log('\n--- Initiating Secure Provider Secret Scan ---');
        const fs = await import('node:fs');
        const path = await import('node:path');
        const { execSync } = await import('node:child_process');

        const scanPaths: string[] = [];
        
        ['.env', '.env.local', '.env.production'].forEach(file => {
          const filePath = path.join('/Users/alexanderanthony', file);
          if (fs.existsSync(filePath)) {
            scanPaths.push(filePath);
          }
        });

        function collectFiles(dir: string): string[] {
          const results: string[] = [];
          if (!fs.existsSync(dir)) return results;
          const list = fs.readdirSync(dir);
          for (const file of list) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
              if (file === 'node_modules' || file === 'dist' || file === '.git' || file === '.gemini') {
                continue;
              }
              results.push(...collectFiles(filePath));
            } else {
              results.push(filePath);
            }
          }
          return results;
        }

        ['src', 'docs', 'scripts'].forEach(dir => {
          const dirPath = path.join('/Users/alexanderanthony', dir);
          scanPaths.push(...collectFiles(dirPath));
        });

        const rootFiles = fs.readdirSync('/Users/alexanderanthony');
        for (const file of rootFiles) {
          if (file.endsWith('.md') || file.endsWith('.html') || file.endsWith('.json')) {
            if (file.includes('AUDIT') || file.includes('REPORT') || file.includes('STATUS')) {
              scanPaths.push(path.join('/Users/alexanderanthony', file));
            }
          }
        }

        const geminiKeyRegex = /AIzaSy[A-Za-z0-9_-]{33}/g;
        const openAIKeyRegex = /sk-(proj-)?[A-Za-z0-9_-]{40,}/g;
        const anthropicKeyRegex = /sk-ant-sid01-[A-Za-z0-9_-]{40,}/g;
        const githubTokenRegex = /ghp_[A-Za-z0-9_-]{36}/g;
        const stripeKeyRegex = /sk_(live|test)_[A-Za-z0-9_-]{24,}/g;

        const findings: any[] = [];

        for (const file of scanPaths) {
          if (!fs.statSync(file).isFile()) continue;
          if (file.includes('.zsh_secrets')) continue;

          try {
            const content = fs.readFileSync(file, 'utf8');
            let match;
            
            geminiKeyRegex.lastIndex = 0;
            while ((match = geminiKeyRegex.exec(content)) !== null) {
              findings.push({ file, type: 'GEMINI_API_KEY', match: `${match[0].slice(0, 4)}••••••••` });
            }
            openAIKeyRegex.lastIndex = 0;
            while ((match = openAIKeyRegex.exec(content)) !== null) {
              findings.push({ file, type: 'OPENAI_API_KEY', match: `${match[0].slice(0, 3)}••••••••` });
            }
            anthropicKeyRegex.lastIndex = 0;
            while ((match = anthropicKeyRegex.exec(content)) !== null) {
              findings.push({ file, type: 'ANTHROPIC_API_KEY', match: `${match[0].slice(0, 7)}••••••••` });
            }
            githubTokenRegex.lastIndex = 0;
            while ((match = githubTokenRegex.exec(content)) !== null) {
              findings.push({ file, type: 'GITHUB_TOKEN', match: `${match[0].slice(0, 4)}••••••••` });
            }
            stripeKeyRegex.lastIndex = 0;
            while ((match = stripeKeyRegex.exec(content)) !== null) {
              findings.push({ file, type: 'STRIPE_SECRET_KEY', match: `${match[0].slice(0, 8)}••••••••` });
            }
          } catch (e) {}
        }

        try {
          const gitLog = execSync('git log -n 5 -p', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
          let match;
          
          geminiKeyRegex.lastIndex = 0;
          while ((match = geminiKeyRegex.exec(gitLog)) !== null) {
            findings.push({ file: 'Git History (Recent Commits)', type: 'GEMINI_API_KEY', match: `${match[0].slice(0, 4)}••••••••` });
          }
          openAIKeyRegex.lastIndex = 0;
          while ((match = openAIKeyRegex.exec(gitLog)) !== null) {
            findings.push({ file: 'Git History (Recent Commits)', type: 'OPENAI_API_KEY', match: `${match[0].slice(0, 3)}••••••••` });
          }
          anthropicKeyRegex.lastIndex = 0;
          while ((match = anthropicKeyRegex.exec(gitLog)) !== null) {
            findings.push({ file: 'Git History (Recent Commits)', type: 'ANTHROPIC_API_KEY', match: `${match[0].slice(0, 7)}••••••••` });
          }
          githubTokenRegex.lastIndex = 0;
          while ((match = githubTokenRegex.exec(gitLog)) !== null) {
            findings.push({ file: 'Git History (Recent Commits)', type: 'GITHUB_TOKEN', match: `${match[0].slice(0, 4)}••••••••` });
          }
          stripeKeyRegex.lastIndex = 0;
          while ((match = stripeKeyRegex.exec(gitLog)) !== null) {
            findings.push({ file: 'Git History (Recent Commits)', type: 'STRIPE_SECRET_KEY', match: `${match[0].slice(0, 8)}••••••••` });
          }
        } catch (gitErr) {}

        console.log(`Scan completed. Found ${findings.length} exposed secret(s).`);
        if (findings.length > 0) {
          console.error('\n[ERROR] Exposed credentials detected:');
          console.error(JSON.stringify(findings, null, 2));
          process.exit(1);
        } else {
          console.log('\n[SUCCESS] No exposed secrets found in scanned paths.');
        }
        break;
      }

      case 'status':
      default: {
        const policy = globalModelRoutingPolicy.getSettings();
        console.log('\n--- Global Model Router Configuration ---');
        console.log(JSON.stringify(policy, null, 2));
        break;
      }
    }
  });
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { DESIGN_COMMANDS, runDesignCommand, type DesignCommand } from '../src/design/DesignCli.js';

const command = process.argv[2] as DesignCommand;
const args = process.argv.slice(3);

if (!DESIGN_COMMANDS.includes(command)) {
  console.error(JSON.stringify({ status: 'error', command, decision: 'revise', message: 'Unknown design command.', allowed: DESIGN_COMMANDS }, null, 2));
  process.exitCode = 1;
} else {
  const result = runDesignCommand(command, args);
  console.log(JSON.stringify(result, null, 2));
  if (result.status === 'error') process.exitCode = 1;
}

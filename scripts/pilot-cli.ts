import { runPilotCommand } from '../src/study/pilots/PilotCli.js';

const [command = 'pilots:list', ...args] = process.argv.slice(2);
const result = runPilotCommand(command, args);
console.log(JSON.stringify(result, null, 2));
if (result.status !== 'ok') process.exitCode = 1;

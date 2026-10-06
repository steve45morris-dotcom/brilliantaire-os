import { globalReportCompiler } from '../src/workspaces/icyflamze/Reports.js';

console.log('⚙️ Compiling Icyflamze OS Workspace Reports...');
const files = globalReportCompiler.compileAllReports();
console.log('✅ Generated markdown documentation reports:');
files.forEach(f => console.log(` - ${f}`));

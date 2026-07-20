import process from "node:process";
export * from './study/index.js';

/**
 * Brilliantaire OS Core Entrypoint
 * "I build before burning."
 */

export function main() {
  console.log("Brilliantaire OS operational.");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

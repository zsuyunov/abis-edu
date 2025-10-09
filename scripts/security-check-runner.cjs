// Register ts-node for TypeScript execution in CommonJS context
require('ts-node').register({
  compilerOptions: { module: 'CommonJS' }
});

require('./security-check.ts');

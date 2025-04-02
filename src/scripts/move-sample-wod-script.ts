import * as fs from 'fs';

// Move the temporary file to replace the original
fs.renameSync('src/scripts/temp-sample-wod-generation.ts', 'src/scripts/sample-wod-generation.ts');
console.log('Successfully moved sample workout generation script to final location.');


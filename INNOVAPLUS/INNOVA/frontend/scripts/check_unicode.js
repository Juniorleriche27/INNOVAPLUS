const { readdirSync, readFileSync } = require('fs');
const { join } = require('path');

const roots = ['app','components','lib','styles'];
const exts = new Set(['.ts','.tsx','.js','.jsx','.json','.md','.mdx','.css']);

function walk(dir){
  for(const name of readdirSync(dir, { withFileTypes: true })){
    const p = join(dir, name.name);
    if(name.isDirectory()) walk(p); else {
      const ext = name.name.slice(name.name.lastIndexOf('.'));
      if(!exts.has(ext)) continue;
      const text = readFileSync(p, 'utf8');
      if(/\\u00/i.test(text)){
        console.error(`[unicode-escape] Found \\u00.. in: ${p}`);
        process.exitCode = 1;
      }
      if(/Chat[- ]?LAYA|Chat Laya/.test(text)){
        console.error(`[chatlaya] Non-uniform naming in: ${p}`);
        process.exitCode = 1;
      }
    }
  }
}

for(const r of roots) walk(join(process.cwd(), r));
if(process.exitCode){
  console.error('\nBuild check failed: replace unicode escapes and unify CHATLAYA naming.');
  process.exit(process.exitCode);
}
console.log('Unicode/CHATLAYA check passed.');


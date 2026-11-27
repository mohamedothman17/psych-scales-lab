/* Copies the assistant's instructions from hub/data/assistant-prompt.js into src/index.js so the two never drift.
   Run after editing the instructions:  node worker/sync-prompt.mjs */
import fs from 'node:fs';
import vm from 'node:vm';
const here = new URL('.', import.meta.url);
const box = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('../hub/data/assistant-prompt.js', here), 'utf8'), box);
const p = box.window.HubAssistantPrompt, file = new URL('src/index.js', here);
const src = fs.readFileSync(file, 'utf8');
const block = '/*__PROMPTS__*/\nconst SYSTEM_PROMPT = ' + JSON.stringify(p.system) + ';\nconst CHECK_PROMPT = ' + JSON.stringify(p.check) + ';\n/*__END_PROMPTS__*/';
const out = src.replace(/\/\*__PROMPTS__\*\/[\s\S]*?\/\*__END_PROMPTS__\*\//, () => block);
if (out === src) console.log('instructions already in sync'); else { fs.writeFileSync(file, out); console.log('instructions copied into src/index.js'); }

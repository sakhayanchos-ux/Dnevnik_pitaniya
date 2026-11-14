import { readFile } from "node:fs/promises";
import { build } from "esbuild";

// Compile the exact production source together with a pinned Supabase client.
// No remote JS dependency is requested by Safari after this build.
const source = await readFile("simple-diary.js", "utf8");
const remoteImport = /const\s*\{\s*createClient\s*\}\s*=\s*await\s+import\(\s*["']https:\/\/esm\.sh\/@supabase\/supabase-js@2\.57\.0["']\s*\)\s*;/;
if (!remoteImport.test(source)) {
  throw new Error("Expected Supabase import not found: update build script deliberately.");
}
const contents = 'import { createClient } from "@supabase/supabase-js";\n' + source.replace(remoteImport,"");
const polyfills = [
 '(function(){',
 'if(!Object.fromEntries){Object.fromEntries=function(iter){var out={};for(var pair of iter){out[pair[0]]=pair[1];}return out;};}',
 'if(typeof Element!=="undefined"&&!Element.prototype.replaceChildren){Element.prototype.replaceChildren=function(){while(this.firstChild)this.removeChild(this.firstChild);for(var i=0;i<arguments.length;i++)this.append(arguments[i]);};}',
 '})();'
].join("\n");

await build({
  stdin: { contents, resolveDir: process.cwd(), sourcefile: "simple-diary-bundled-entry.js", loader: "js" },
  bundle: true,
  platform: "browser",
  target: ["safari12"],
  format: "iife",
  outfile: "simple-diary.compat.js",
  charset: "utf8",
  banner: { js: polyfills },
  minify: true,
  legalComments: "none",
  sourcemap: false,
  logLevel: "info"
});
console.log("Older Safari-compatible diary bundle generated from the current source.");

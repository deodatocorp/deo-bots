// Gera src/painel-ui.mjs a partir de src/painel-ui.html (rode: npm run painel)
import { readFileSync, writeFileSync } from "node:fs";
const html = readFileSync(new URL("../src/painel-ui.html", import.meta.url), "utf8");
writeFileSync(
  new URL("../src/painel-ui.mjs", import.meta.url),
  "// Arquivo gerado por scripts/gerar-painel.mjs a partir de src/painel-ui.html — edite o .html, não este arquivo.\nexport default " + JSON.stringify(html) + ";\n"
);
console.log("painel-ui.mjs gerado (" + html.length + " caracteres)");

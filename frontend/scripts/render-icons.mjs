import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public", "icon.svg"));

const targets = [
  ["apple-touch-icon.png", 180],
  ["icon-192.png", 192],
  ["icon-512.png", 512],
];

for (const [name, size] of targets) {
  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
    background: "transparent",
  })
    .render()
    .asPng();
  writeFileSync(join(root, "public", name), png);
  console.log(`wrote public/${name} (${size}x${size})`);
}

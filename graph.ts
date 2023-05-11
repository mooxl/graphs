import { Edge } from "./types.ts";
import { logTime } from "./utilities.ts";
export class Graph {
  size: number;
  nodes: Edge[][];

  constructor(graph: string) {
    const start = performance.now();
    const lines = Deno.readTextFileSync(`./graphs/${graph}.txt`).split("\r\n");
    this.size = +lines.shift()!;
    this.nodes = Array.from({ length: this.size }, () => []);
    for (const line of lines) {
      const [from, to, weight] = line.split("\t").map((value) => +value);
      this.nodes[from].push({ from, to, weight });
      this.nodes[to]!.push({ from: to, to: from, weight });
    }
    logTime("Graph built in", start, performance.now());
  }
}

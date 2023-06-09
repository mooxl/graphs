import { Edge } from "./types.ts";
import { logTime } from "./utilities.ts";
export class Graph {
  size: number;
  nodes: { balance: number; edges: Edge[] }[];

  constructor(graph: string, directed: boolean, balanced: boolean) {
    const start = performance.now();
    const lines = Deno.readTextFileSync(`./graphs/${graph}.txt`).split("\r\n");
    this.size = +lines.shift()!;
    this.nodes = [];
    if (balanced) {
      for (let i = 0; i < this.size; i++) {
        this.nodes.push({ balance: +lines.shift()!, edges: [] });
      }
    } else {
      this.nodes = Array.from({ length: this.size }, () => {
        return { balance: 0, edges: [] };
      });
    }
    for (const line of lines) {
      const [from, to, weight, capacity] = line
        .split("\t")
        .map((value) => +value);
      this.nodes[from].edges.push({ from, to, weight, capacity, flow: 0 });
      !directed &&
        this.nodes[to]!.edges.push({
          from: to,
          to: from,
          weight,
          capacity,
          flow: 0,
        });
    }
    logTime("Graph built in", start, performance.now());
  }
}

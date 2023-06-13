import { Edge } from "./types.ts";
import { logTime } from "./utilities.ts";
export class Graph {
  size: number;
  nodes: { balance: number; edges: Edge[] }[];

  constructor(graph: string, directed: boolean) {
    const start = performance.now();
    const lines = Deno.readTextFileSync(`./graphs/${graph}.txt`).split("\r\n");
    this.size = +lines.shift()!;
    this.nodes = Array.from({ length: this.size }, () => {
      return { balance: 0, edges: [] };
    });
    for (const line of lines) {
      const [from, to, weight] = line.split("\t").map((value) => +value);
      this.nodes[from].edges.push({ from, to, weight });
      !directed && this.nodes[to]!.edges.push({ from: to, to: from, weight });
    }
    logTime("Graph built in", start, performance.now());
  }
}

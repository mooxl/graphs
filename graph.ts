import { verbose } from "./main.ts";
import { format } from "duration";
import { colors } from "cliffy";
export class Graph {
  size: number;
  nodes: Map<number, Set<number>> = new Map();

  constructor(graph: string) {
    const start = performance.now();
    const data = Deno.readTextFileSync(`./graphs/${graph}.txt`);
    let end = performance.now();
    verbose && this.logTime("File read in", start, end);
    const lines = data.split("\r\n");
    this.size = +lines.shift()!;
    for (let i = 0; i < this.size; i++) {
      this.nodes.set(i, new Set());
    }
    for (const line of lines) {
      const [from, to] = line.split("\t").map((node) => +node);
      this.nodes.get(from)!.add(to);
      this.nodes.get(to)!.add(from);
    }
    end = performance.now();
    verbose && this.logTime("Graph built in", start, end);
  }

  get subGraphs() {
    const visited = new Uint8Array(this.size);
    let subgraphs = 0;
    const start = performance.now();
    for (let i = 0; i < this.size; i++) {
      if (!visited[i]) {
        visited[i] = 1;
        this.dfs(i, visited);
        subgraphs++;
      }
    }
    const end = performance.now();
    verbose && this.logTime("Subgraph created in", start, end);
    return subgraphs;
  }

  private dfs(start: number, visited: Uint8Array) {
    const stack = [start];
    while (stack.length) {
      const node = stack.pop()!;
      for (const neighbor of this.nodes.get(node!)!) {
        if (!visited[neighbor]) {
          visited[neighbor] = 1;
          stack.push(neighbor);
        }
      }
    }
  }

  private logTime(text: string, start: number, end: number) {
    console.log(
      `${text} ${colors.bold.magenta(
        format(end - start, { ignoreZero: true })
      )}`
    );
  }
}

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
    lines.forEach((line) => {
      const [from, to] = line.split("\t").map((node) => +node);
      this.nodes.get(from)!.add(to);
      this.nodes.get(to)!.add(from);
    });
    end = performance.now();
    verbose && this.logTime("Graph built in", start, end);
  }

  get subGraphs() {
    const visited = new Set<number>();
    const subgraphs: number[][] = [];
    for (let i = 0; i < this.size; i++) {
      if (!visited.has(i)) {
        const start = performance.now();
        const subgraph = this.bfs(i);
        subgraphs.push([...subgraph]);
        for (const node of subgraph) {
          visited.add(node);
        }
        const end = performance.now();
        verbose && this.logTime("Subgraph created in", start, end);
      }
    }
    return subgraphs;
  }

  private bfs(start: number) {
    const visited = new Set([start]);
    const queue = new Set(this.nodes.get(start)!);
    while (queue.size) {
      const node = queue.values().next().value;
      visited.add(node);
      for (const neighbor of this.nodes.get(node)!) {
        if (!visited.has(neighbor)) queue.add(neighbor);
      }
      queue.delete(node);
    }
    return visited;
  }

  private logTime(text: string, start: number, end: number) {
    console.log(
      `${text} ${colors.bold.magenta(
        format(end - start, { ignoreZero: true })
      )}`
    );
  }
}

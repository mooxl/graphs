import { format } from "duration";
import { colors } from "cliffy";

export class Graph {
  size: number;
  nodes: { to: number; weight: number }[][];
  verbose: boolean;

  constructor(graph: string, verbose: boolean) {
    this.verbose = verbose;
    let start = performance.now();
    const data = Deno.readTextFileSync(`./graphs/${graph}.txt`);
    let end = performance.now();
    this.verbose && this.logTime("File read in", start, end);
    start = performance.now();
    const lines = data.split("\r\n");
    this.size = +lines.shift()!;
    end = performance.now();
    this.verbose &&
      this.logTime("Lines split and size initialized in", start, end);
    start = performance.now();
    this.nodes = Array.from({ length: this.size }, () => []);
    end = performance.now();
    this.verbose && this.logTime("Graph filled in", start, end);
    start = performance.now();
    for (const line of lines) {
      const [from, to, weight] = line.split("\t").map((node) => +node);
      if (!this.nodes[from].find((node) => node.to === to))
        this.nodes[from].push({ to, weight });
      if (!this.nodes[to].find((node) => node.to === from))
        this.nodes[to]!.push({ to: from, weight });
    }

    end = performance.now();
    this.verbose && this.logTime("Graph built in", start, end);
  }

  get subGraphs() {
    const visited = new Uint8Array(this.size);
    const subgraphs: number[][] = [];
    const start = performance.now();
    for (let i = 0; i < this.size; i++) {
      if (!visited[i]) {
        visited[i] = 1;
        subgraphs.push(this.dfs(i, visited));
      }
    }
    const end = performance.now();
    this.verbose && this.logTime("Subgraphs created in", start, end);
    return subgraphs;
  }

  private dfs(start: number, visited: Uint8Array) {
    const stack = [start];
    const subgraph = [];
    while (stack.length) {
      const node = stack.pop()!;
      subgraph.push(node);
      for (const neighbor of this.nodes[node]!) {
        if (!visited[neighbor.to]) {
          visited[neighbor.to] = 1;
          stack.push(neighbor.to);
        }
      }
    }
    return subgraph;
  }

  private logTime(text: string, start: number, end: number) {
    console.log(
      `${text} ${colors.bold.magenta(
        format(end - start, { ignoreZero: true })
      )}`
    );
  }
}

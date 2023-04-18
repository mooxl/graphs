import { format } from "duration";
import { colors } from "cliffy";
import { BinaryHeap } from "collections/binary_heap.ts";

type Node = { from: number; to: number; weight: number };
export class Graph {
  size: number;
  nodes: Node[][];
  verbose: boolean;

  constructor(graph: string, verbose: boolean) {
    this.verbose = verbose;
    let start = performance.now();
    const data = Deno.readTextFileSync(`./graphs/${graph}.txt`);
    this.verbose && this.logTime("File read in", start, performance.now());
    start = performance.now();
    const lines = data.split("\r\n"); //
    this.size = +lines.shift()!;
    this.verbose &&
      this.logTime(
        "Lines split and size initialized in",
        start,
        performance.now()
      );
    start = performance.now();
    this.nodes = Array.from({ length: this.size }, () => []);
    this.verbose && this.logTime("Graph filled in", start, performance.now());
    start = performance.now();
    for (const line of lines) {
      const [from, to, weight] = line.split("\t").map((node) => +node);
      if (!this.nodes[from].find((node) => node.to === to))
        this.nodes[from].push({ from, to, weight });
      if (!this.nodes[to].find((node) => node.to === from))
        this.nodes[to]!.push({ from: to, to: from, weight });
    }
    this.verbose && this.logTime("Graph built in", start, performance.now());
  }

  get prim() {
    const visited = new Uint8Array(this.size);
    const mst: Node[] = [];
    const start = performance.now();
    const heap = new BinaryHeap<Node>(
      (a: Node, b: Node) => a.weight - b.weight
    );
    heap.push({ from: 0, to: 0, weight: 0 });
    while (!heap.isEmpty()) {
      const node = heap.pop()!;
      if (!visited[node.to]) {
        visited[node.to] = 1;
        mst.push(node);
        for (const neighbor of this.nodes[node.to]) {
          if (!visited[neighbor.to]) {
            heap.push(neighbor);
          }
        }
      }
    }
    this.verbose && this.logTime("MST created in", start, performance.now());
    return mst;
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
    this.verbose &&
      this.logTime("Subgraphs created in", start, performance.now());
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

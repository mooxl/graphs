import { format } from "duration";
import { colors } from "cliffy";
import { BinaryHeap } from "collections/binary_heap.ts";

type Edge = { from: number; to: number; weight: number };
export class Graph {
  size: number;
  edges: Edge[][];

  constructor(graph: string) {
    const start = performance.now();
    const data = Deno.readTextFileSync(`./graphs/${graph}.txt`);
    const lines = data.split("\r\n");
    this.size = +lines.shift()!;
    this.edges = Array.from({ length: this.size }, () => []);
    for (const line of lines) {
      const [from, to, weight] = line.split("\t").map((edge) => +edge);
      if (!this.edges[from].find((edge) => edge.to === to))
        this.edges[from].push({ from, to, weight });
      if (!this.edges[to].find((edge) => edge.to === from))
        this.edges[to]!.push({ from: to, to: from, weight });
    }
    this.logTime("Graph built in", start, performance.now());
  }

  get subGraphs() {
    const start = performance.now();
    const visited = new Uint8Array(this.size);
    const subgraphs: number[][] = [];
    for (let i = 0; i < this.size; i++) {
      if (!visited[i]) {
        visited[i] = 1;
        subgraphs.push(this.dfs(i, visited));
      }
    }
    this.logTime("Subgraphs created in", start, performance.now());
    return subgraphs;
  }

  get prim() {
    const start = performance.now();
    const visited = new Uint8Array(this.size);
    const mst: Edge[] = [];
    const heap = new BinaryHeap<Edge>((a, b) => a.weight - b.weight);
    heap.push({ from: 0, to: 0, weight: 0 });
    while (!heap.isEmpty()) {
      const edge = heap.pop()!;
      if (!visited[edge.to]) {
        visited[edge.to] = 1;
        mst.push(edge);
        for (const neighbor of this.edges[edge.to]) {
          if (!visited[neighbor.to]) {
            heap.push(neighbor);
          }
        }
      }
    }
    this.logTime("MST created in", start, performance.now());
    return mst;
  }

  get kruskal() {
    const start = performance.now();
    const mst: Edge[] = [];
    const setId = Array.from({ length: this.size }, (_, i) => i);
    const heap = new BinaryHeap<Edge>((a, b) => a.weight - b.weight);
    for (const node of this.edges) {
      heap.push(...node);
    }
    while (!heap.isEmpty()) {
      const edge = heap.pop()!;
      const setIdFrom = this.findSetId(edge.from, setId);
      const setIdTo = this.findSetId(edge.to, setId);
      if (setIdFrom !== setIdTo) {
        mst.push(edge);
        setId[setIdTo] = setIdFrom;
      }
    }
    this.logTime("MST created in", start, performance.now());
    return mst;
  }

  private findSetId(node: number, setId: number[]) {
    if (setId[node] !== node) {
      setId[node] = this.findSetId(setId[node], setId);
    }
    return setId[node];
  }

  private dfs(start: number, visited: Uint8Array) {
    const stack = [start];
    const subgraph = [];
    while (stack.length) {
      const node = stack.pop()!;
      subgraph.push(node);
      for (const neighbor of this.edges[node]!) {
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
      `${text} ${colors.magenta(format(end - start, { ignoreZero: true }))}`
    );
  }
}

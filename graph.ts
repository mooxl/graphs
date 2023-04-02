type Graphs = "1" | "2" | "3" | "gross" | "ganzGross" | "ganzGanzGross";

export class Graph {
  size: number;
  nodes: Map<number, Set<number>> = new Map();

  constructor(graph: Graphs) {
    const data = Deno.readTextFileSync(`./graphs/${graph}.txt`);
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
  }

  get subGraphs() {
    const visited = new Set<number>();
    const subgraphs: number[][] = [];
    for (let i = 0; i < this.size; i++) {
      if (!visited.has(i)) {
        const subgraph = this.bfs(i);
        subgraphs.push([...subgraph]);
        for (const node of subgraph) {
          visited.add(node);
        }
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
      for (const item of this.nodes.get(node)!) {
        if (!visited.has(item)) queue.add(item);
      }
      queue.delete(node);
    }
    return visited;
  }
}

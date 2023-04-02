import { Graph } from "./graph.ts";

const graph = new Graph("gross");

console.log(graph.subGraphs.length);

Deno.bench("subGraphs", () => {
  const graph = new Graph("gross").subGraphs;
});

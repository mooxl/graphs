import { Input, Select, Toggle, colors } from "cliffy";
import { Graph } from "./graph.ts";
import {
  bellmanFord,
  branchAndBound,
  bruteForce,
  dijkstra,
  doubleTree,
  kruskal,
  nearestNeighbour,
  prim,
  subGraphs,
} from "./algorithms.ts";
import { logWeight } from "./utilities.ts";

while (true) {
  const directed = await Toggle.prompt("Is the graph directed?");
  const graph = new Graph(
    await Input.prompt({
      message: "Choose a graph",
      suggestions: [
        "1",
        "2",
        "3",
        "Fluss",
        "Fluss2",
        "gross",
        "ganzGross",
        "ganzGanzGross",
        "G_1_2",
        "G_1_20",
        "G_1_200",
        "G_10_20",
        "G_10_200",
        "G_100_200",
        "K_10",
        "K_10e",
        "K_12",
        "K_12e",
        "K_15",
        "K_15e",
        "K_20",
        "K_30",
        "K_50",
        "K_70",
        "K_100",
        "Wege1",
        "Wege2",
        "Wege3",
      ],
    }),
    directed
  );
  while (true) {
    const command = await Select.prompt({
      message: "What do you want to see?",
      options: [
        { name: "Size of subgraphs", value: "subgraphsSize" },
        { name: "Weight of MST via Prim", value: "primWeight" },
        { name: "Weight of MST via Kruskal", value: "kruskalWeight" },
        { name: "Length via Nearest Neighbor", value: "nearestNeighbor" },
        { name: "Length via Double Tree", value: "doubleTree" },
        { name: "Length via Brute Force", value: "bruteForce" },
        { name: "Length via Branch and Bound", value: "branchAndBound" },
        { name: "Shortest Path via Dijkstra", value: "dijkstra" },
        { name: "Shortest Path via Bellman-Ford", value: "bellmanFord" },
        { name: "Exit", value: "exit" },
      ],
    });
    switch (command) {
      case "subgraphsSize":
        console.log(
          `The graph has ${colors.cyan(
            subGraphs(graph).length.toString()
          )} subgraphs`
        );
        break;
      case "primWeight":
        console.log(
          `The graph has an MST with a weight of ${logWeight(prim(graph))}`
        );
        break;
      case "kruskalWeight":
        console.log(
          `The graph has an MST with a weight of ${logWeight(kruskal(graph))}`
        );
        break;
      case "nearestNeighbor":
        console.log(`The length is ${logWeight(nearestNeighbour(graph))}`);
        break;
      case "doubleTree":
        console.log(`The length is ${logWeight(doubleTree(graph))}`);
        break;
      case "bruteForce":
        console.log(`The length is ${logWeight(bruteForce(graph))}`);
        break;
      case "branchAndBound":
        console.log(`The length is ${logWeight(branchAndBound(graph))}`);
        break;
      case "bellmanFord":
      case "dijkstra": {
        const chosenFunction = command === "dijkstra" ? dijkstra : bellmanFord;
        const startNode = await Input.prompt({
          message: "Choose a start node",
          default: "0",
        });
        const endNode = await Input.prompt({
          message: "Choose a end node",
          default: "0",
        });
        console.log(
          `The shortest paths from ${startNode} to ${endNode} is ${colors.cyan(
            chosenFunction(graph, +startNode)[+endNode].toFixed(2)
          )}`
        );
        break;
      }
    }
    if (command === "exit") {
      break;
    }
  }
}

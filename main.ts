import { Select, Toggle, colors } from "cliffy";
import { Graph } from "./graph.ts";

export const verbose = await Toggle.prompt("Show the time?");

const graph = new Graph(
  await Select.prompt({
    message: "Choose a graph",
    options: [
      "test",
      "1",
      "2",
      "3",
      "gross",
      "ganzGross",
      "ganzGanzGross",
      "G_1_2",
      "G_1_20",
      "G_1_200",
      "G_10_20",
      "G_10_200",
      "G_100_200",
    ],
  }),
  verbose
);
while (true) {
  const command = await Select.prompt({
    message: "What do you want to see?",
    options: [
      { name: "Size of graph", value: "graphSize" },
      {
        name: "List of nodes",
        value: "graphNodes",
      },
      Select.separator("---------"),
      { name: "Size of subgraphs", value: "subgraphsSize" },
      { name: "List of subgraphs", value: "subgraphsNodes" },
      Select.separator("---------"),
      { name: "Weight of MST via Prim", value: "primWeight" },
      { name: "MST via Prim", value: "primNodes" },
    ],
  });
  switch (command) {
    case "graphSize":
      console.log(
        `The graph has ${colors.magenta(graph.size.toString())} nodes`
      );
      break;
    case "graphNodes":
      console.log(graph.nodes);
      break;
    case "subgraphsSize":
      console.log(
        `The graph has ${colors.magenta(
          graph.subGraphs.length.toString()
        )} subgraphs`
      );
      break;
    case "subgraphsNodes":
      console.log(graph.subGraphs);
      break;
    case "primWeight":
      console.log(
        graph.prim.reduce((acc, node) => acc + node.weight, 0).toFixed(5)
      );
      break;
    case "primNodes":
      console.log(graph.prim);
      break;
  }
}

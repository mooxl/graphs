export type Edge = {
  from: number;
  to: number;
  weight: number;
  capacity?: number;
};

export type PartialTour = {
  path: number[];
  lowerBound: number;
};

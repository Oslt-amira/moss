export type SeedKind = 'daisy' | 'clover' | 'bluebell' | 'mushroom';
export type PlantedSeed = { id: number; kind: SeedKind; position: [number, number, number] };
export const seeds: {kind: SeedKind; name: string; note: string; color: string}[] = [
  {kind: 'daisy', name: 'Daisy', note: 'A little sunlight', color: '#d7c47c'},
  {kind: 'clover', name: 'Clover', note: 'Three little leaves', color: '#8b9c6d'},
  {kind: 'mushroom', name: 'Mushroom', note: 'A woodland spore', color: '#b5a489'},
  {kind: 'bluebell', name: 'Bluebell', note: 'Quiet, nodding bells', color: '#9ca8bd'},
];

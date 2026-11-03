export type Photo = {
  id: string; filename: string; date: string; airport: string;
  models: string[]; airlines: string[]; flights: string[];
  image: string; thumbnail: string; note: string; livery: string;
  subjects?: {airline:string;model:string}[];
  registration?: {value:string;status:string;basis:string;sourceUrl?:string};
};
export type Entry = {
  id: string; name: string; kind: string; photoIds: string[]; cover: string | null;
  unlocked: boolean; airports: string[]; firstSeen: string | null; lastSeen: string | null;
  manufacturer?: string; family?: string; category?: string; shortName?: string;
  chineseName?: string; code?: string; country?: string; region?: string;
  livery?: string; displayModel?: string;
};
export type Mode = 'aircraft' | 'airlines' | 'photos' | 'flights';
export type Filters = { query: string; status: string; airport: string; manufacturer: string; airline: string; country: string; model: string; category: string; livery: string; sort: string };
export type Flight = {id:string;date:string;airline:string;flight:string;origin:string;destination:string;model:string|null;modelLabel:string;registration:string|null};

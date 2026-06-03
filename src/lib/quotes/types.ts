export type QuotePool =
  | "winner"
  | "upset"
  | "loser"
  | "last"
  | "xtreme"
  | "perfect"
  | "random"
  | "eos"
  | "toxic"
  | "god";

export interface QuoteTemplate {
  pool: QuotePool;
  text: string;
}

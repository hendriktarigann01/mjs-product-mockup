export interface TextAreaConfig {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type FormChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>;

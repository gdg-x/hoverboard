type Logo = import('./logo').Logo;

export interface Partner {
  logos: Logo[];
  order: number;
  title: string;
}

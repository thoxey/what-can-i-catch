export type Category = 'fish' | 'bugs' | 'sea';
export type Hemisphere = 'north' | 'south';

export interface Critter {
  name: string;
  slug: string;
  category: Category;
  price: number | null;
  time: string;
  location: string | null;
  shadow: string | null;
  months: { north: boolean[]; south: boolean[] };
  icon: string | null;
}

export type CrittersData = Record<Category, Critter[]>;

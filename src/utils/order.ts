interface Orderable {
  order: number;
}

export const order = <A extends Orderable, B extends Orderable>(a: A, b: B) => a.order - b.order;

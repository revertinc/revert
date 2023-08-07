export type ValueOf<T> = T[keyof T];

export type Subtype<T, U extends T> = U;

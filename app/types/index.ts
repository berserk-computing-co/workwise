export * from './api';
export * from './api/interfaces';
export * from './bids';
export * from './client';
export * from './contractor';
export * from './equipment';
export * from './files';
export * from './jobs';
export * from './navigation';
export * from './users';

export type Func<T> = (...args: any) => T;

export interface ModalViewPropTypes {
  onComplete: Func<void>;
};

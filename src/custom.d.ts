declare namespace Express {
  export interface Request {
    userId?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: any;
  }
}

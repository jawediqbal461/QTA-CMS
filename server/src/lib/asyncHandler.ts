import type { NextFunction, Request, RequestHandler, Response } from "express";

// Express 4 does not forward a rejected promise from an async handler to
// the error middleware on its own (that's an Express 5 behavior) - an
// unhandled rejection here would otherwise hang the request or crash the
// process. Wrapping every async handler in this closes that gap.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

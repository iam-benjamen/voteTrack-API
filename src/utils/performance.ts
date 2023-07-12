import { NextFunction, Response, Request } from "express";
import { performance } from "perf_hooks";

export const measureElapsedTime = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = performance.now();

  res.on("finish", () => {
    const end = performance.now();
    const elapsedTime = end - start;

    console.log(`Request took ${elapsedTime / 1000} seconds`);
  });

  next();
};

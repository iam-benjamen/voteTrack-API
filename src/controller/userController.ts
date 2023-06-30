import { Request, Response, NextFunction } from "express";

const isRestrictedTo = (roles: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: "error",
        message:
          "Access denied. You do not have permission to perform this action.",
      });
    }

    next();
  };
};



export default {
  isRestrictedTo,
};

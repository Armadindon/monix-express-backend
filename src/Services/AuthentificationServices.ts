import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User } from "../Model/User";

/** Utilitary middleware to check if the user is connected */
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    console.log(err);
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
};

/** Utilitary middleware to use to get user (after the authenticateToken middleware) */
export const setUser: RequestHandler = (req, res, next) => {
  if (req.userId == undefined) return res.sendStatus(401);
  req.user = User.findOne({ where: { id: req.userId } });
  next();
};

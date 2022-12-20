import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { User } from "../Model/User";

/** Utilitary middleware to check if the user is connected */
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET as string, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.userId = user.userId;
    next();
  });
};

/** Utilitary middleware to use to get user (after the authenticateToken middleware) */
export const setUser: RequestHandler = async (req, res, next) => {
  if (req.userId == undefined) return res.sendStatus(401);
  req.user = await User.findOne({ where: { id: req.userId } });
  next();
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  if (req.userId == undefined) return res.sendStatus(401);
  let user: User;
  if (req.user !== undefined) user = req.user;
  else user = (await User.findOne({ where: { id: req.userId } })) as User;

  if (!user.admin) {
    const error = new Error(
      "Il faut être un admin pour accéder à cette fonctionnalité"
    );
    next(error);
  }
  next();
};

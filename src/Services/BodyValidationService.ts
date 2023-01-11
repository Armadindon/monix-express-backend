import { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '..';

export const checkForValidationErrors: RequestHandler = (req, res, next) => {
  const errors = validationResult(req);
  //On affiche seulement la première erreur
  if (!errors.isEmpty()) next(new AppError(400, errors.array()[0].msg));
  next();
};

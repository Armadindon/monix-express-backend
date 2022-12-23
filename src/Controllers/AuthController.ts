import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../Model/User';
import { json } from 'express';
import { AppError } from '..';
import dotenv from 'dotenv';
dotenv.config();

const router = Router();

router.use(json());

// Handling post request
router.post('/login', async (req, res, next) => {
  console.log('AUTHENTIFICATION');
  const { username, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ where: { username } });
  } catch {
    const error = new AppError(
      500,
      'Une erreur inconnue à eu lieu, merci de vérifier les paramètres de la requête',
    );
    return next(error);
  }
  if (!existingUser || !existingUser.validPassword(password)) {
    const error = new AppError(400, 'Impossible de se connecter');
    return next(error);
  }
  let token;
  try {
    //Creating jwt token
    token = jwt.sign(
      {
        userId: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' },
    );
  } catch (err) {
    const error = new AppError(
      500,
      'Impossible de créer le token JWT ! Merci de vérifier les paramètres de la requete',
    );
    return next(error);
  }
  res.status(200).json({
    success: true,
    data: {
      userId: existingUser.id,
      email: existingUser.email,
      token: token,
    },
  });
});

// Handling post request code login
router.post('/codeLogin', async (req, res, next) => {
  console.log('AUTHENTIFICATION');
  const { code } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ where: { code } });
  } catch {
    const error = new AppError(
      500,
      'Une erreur inconnue à eu lieu, merci de vérifier les paramètres de la requête',
    );
    return next(error);
  }
  if (!existingUser) {
    const error = new AppError(400, 'Impossible de se connecter');
    return next(error);
  }
  let token;
  try {
    //Creating jwt token
    token = jwt.sign(
      {
        userId: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' },
    );
  } catch (err) {
    const error = new AppError(
      500,
      'Impossible de créer le token JWT ! Merci de vérifier les paramètres de la requete',
    );
    return next(error);
  }
  res.status(200).json({
    success: true,
    data: {
      userId: existingUser.id,
      email: existingUser.email,
      token: token,
    },
  });
});

// Handling post request
router.post('/signup', async (req, res, next) => {
  const { username, password, email } = req.body;
  const newUser = User.build({ username, password, email });
  try {
    await newUser.save();
  } catch {
    const error = new AppError(
      400,
      "Impossible de créer l'utilisateur ! Merci de vérifier vos paramètres",
    );
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, username: newUser.username, email: newUser.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' },
    );
  } catch (err) {
    const error = new AppError(
      500,
      'Impossible de créer le token JWT ! Merci de vérifier les paramètres de la requete',
    );
    return next(error);
  }
  res.status(201).json({
    success: true,
    data: { userId: newUser.id, email: newUser.email, token: token },
  });
});

export default router;

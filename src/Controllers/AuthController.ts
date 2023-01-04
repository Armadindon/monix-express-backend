import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../Model/User';
import { json } from 'express';
import { AppError } from '..';
import dotenv from 'dotenv';
import { v4 as uuidV4 } from 'uuid';
import nodemailer from 'nodemailer';
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

// Handling post request
router.post('/forgottenPassword', async (req, res, next) => {
  const { username } = req.body;
  const foundUser = await User.findOne({ where: { username } });

  if (foundUser === null) {
    const error = new AppError(404, 'User not found');
    return next(error);
  }

  const newResetCode = uuidV4();

  await foundUser.update({ resetCode: newResetCode });

  const resetUrl = new URL(process.env.FRONT_END_URL || '');
  resetUrl.searchParams.append('code', newResetCode);

  // On envoie un email
  console.log(
    process.env.SMTP_HOST,
    process.env.SMTP_PORT,
    process.env.SMTP_USER,
    process.env.SMTP_PASS,
  );
  const mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT as string),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await mailer.sendMail({
    from: `"Monix 2" <${process.env.SMTP_USER}>`,
    to: foundUser.email,
    subject: 'Mot de passe Monix oublié',
    html: `<p>Lien pour le mot de passe oublié ${resetUrl}</p>`,
    text: `Lien pour le mot de passe oublié ${resetUrl}`,
  });

  res.status(201).json({
    success: true,
    message: 'Lien de reset bien envoyé',
  });
});

// Handling post request
router.post('/resetPassword', async (req, res, next) => {
  const { code, newPassword, passwordConfirmation } = req.body;
  const foundUser = await User.findOne({ where: { resetCode: code } });

  if (foundUser === null) {
    const error = new AppError(404, 'No user found for this reset code');
    return next(error);
  }

  if (newPassword !== passwordConfirmation) {
    const error = new AppError(
      400,
      'Le mot de passe et la confirmation ne correspondent pas',
    );
    return next(error);
  }

  foundUser.update({ password: newPassword, resetCode: null });
  res.status(200).json({
    success: true,
    message: 'Votre mot de passe a bien changé, vous pouvez vous reconnecter',
  });
});

export default router;

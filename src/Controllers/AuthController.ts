import { Router, NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../Model/User';
import { json } from 'express';
import { AppError } from '..';
import dotenv from 'dotenv';
import { v4 as uuidV4 } from 'uuid';
import nodemailer from 'nodemailer';
import { checkSchema } from 'express-validator';
import { checkForValidationErrors } from '../Services/BodyValidationService';
dotenv.config();

const router = Router();

router.use(json());

// Handling post request
const loginSchema = {
  username: {
    isString: {
      errorMessage: "L'identifiant doit être une chaîne de caractères !",
    },
    notEmpty: {
      errorMessage: "L'identifiant ne doit pas être vide !",
    },
    exists: {
      errorMessage: "Le champs 'username' est requis dans le body",
    },
  },
  password: {
    isString: {
      errorMessage: 'Le mot de passe doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'Le mot de passe ne doit pas être vide !',
    },
    exists: {
      errorMessage: "Le champs 'password' est requis dans le body",
    },
  },
};
router.post(
  '/login',
  checkSchema(loginSchema),
  checkForValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
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
        { expiresIn: '30d' },
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
  },
);

// Handling post request code login
const codeLoginSchema = {
  code: {
    isString: {
      errorMessage: 'Le code de login doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'Le code de login ne doit pas être vide !',
    },
    exists: {
      errorMessage: "Le champs 'code' est requis dans le body",
    },
  },
};
router.post(
  '/codeLogin',
  checkSchema(codeLoginSchema),
  checkForValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
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
        { expiresIn: '30d' },
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
  },
);

// Handling post request
const forgottenPasswordSchema = {
  username: {
    isString: {
      errorMessage: "L'identifiant doit être une chaîne de caractères !",
    },
    notEmpty: {
      errorMessage: "L'identifiant ne doit pas être vide !",
    },
    exists: {
      errorMessage: "Le champs 'username' est requis dans le body",
    },
  },
};
router.post(
  '/forgottenPassword',
  checkSchema(forgottenPasswordSchema),
  checkForValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
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
  },
);

// Handling post request
const resetPasswordSchema = {
  code: {
    isString: {
      errorMessage: 'Le code de reset doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'Le code de reset ne doit pas être vide !',
    },
    exists: {
      errorMessage: "Le champs 'code' est requis dans le body",
    },
  },
  newPassword: {
    isString: {
      errorMessage:
        'Le nouveau mot de passe doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'Le nouveau mot de passe ne doit pas être vide !',
    },
    exists: {
      errorMessage: "Le champs 'newPassword' est requis dans le body",
    },
  },
  passwordConfirmation: {
    isString: {
      errorMessage:
        'La confirmation de mot de passe doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'Le confirmation de mot de passe ne doit pas être vide !',
    },
    exists: {
      errorMessage: "Le champs 'passwordConfirmation' est requis dans le body",
    },
  },
};

router.post(
  '/resetPassword',
  checkSchema(resetPasswordSchema),
  checkForValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    const { code, newPassword, passwordConfirmation } = req.body;
    const foundUser = await User.findOne({ where: { resetCode: code } });

    if (foundUser === null) {
      const error = new AppError(404, 'No user found for this reset code');
      return next(error);
    }

    if (newPassword === '') {
      const error = new AppError(
        400,
        'Merci de rentrer un mot de passe valide !',
      );
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
  },
);

export default router;

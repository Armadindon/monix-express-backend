import { NextFunction, Request, Response, Router, json } from 'express';
import {
  authenticateToken,
  isAdmin,
  setUser,
} from '../Services/AuthentificationServices';
import { User } from '../Model/User';
import multer from 'multer';
import fs from 'fs';
import { v4 as uuidV4 } from 'uuid';
import { AppError } from '..';
import { checkSchema } from 'express-validator';
import { checkForValidationErrors } from '../Services/BodyValidationService';

const router = Router();
const upload = multer({ dest: 'public/tmp/' });

router.use(json());

type CleanedUser = Partial<User>;

const userSchema = {
  username: {
    isString: {
      errorMessage: "Le nom d'utilisateur doit être une chaîne de caractères !",
    },
    notEmpty: {
      errorMessage: "Le nom d'utilisateur ne doit pas être vide !",
    },
    exists: {
      errorMessage: "Le champs 'username' est requis dans le body",
    },
  },
  email: {
    isEmail: {
      errorMessage: "L'adresse email doit être un email !",
    },
    notEmpty: {
      errorMessage: "L'adresse email ne doit pas être vide !",
    },
    exists: {
      errorMessage: "Le champs 'email' est requis dans le body",
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
  admin: {
    isBoolean: {
      errorMessage: 'Le champ admin doit être un booléen !',
    },
    optional: { options: { nullable: true } },
  },
  balance: {
    isFloat: {
      errorMessage: "La balance de l'utilisateur doit être un nombre !",
    },
    optional: { options: { nullable: true } },
  },
};

/** Clean the user from all the attributes that we don't want to include */
export const cleanUser = (user: User): CleanedUser => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, code: __, ...cleanedUser } = user.dataValues;
  return cleanedUser;
};

router.get('/', authenticateToken, isAdmin, async (req, res) => {
  const users = await User.findAll();
  const cleanedUsers: CleanedUser[] = [];
  for (let i = 0; i < users.length; i++) cleanedUsers.push(cleanUser(users[i]));
  res.status(200).json({ success: true, data: cleanedUsers });
});

router.post(
  '/',
  authenticateToken,
  isAdmin,
  checkSchema(userSchema),
  checkForValidationErrors,
  async (req: Request, res: Response) => {
    // On crée l'utilisateur
    const userToSet = req.body;
    const createdUser = await User.create({
      username: userToSet?.username,
      email: userToSet?.email,
      password: userToSet.password,
      admin: userToSet.admin,
      balance: userToSet.balance,
    });
    res.status(200).json({ success: true, data: cleanUser(createdUser) });
  },
);

router.get('/me', authenticateToken, setUser, async (req, res) => {
  const user = req.user as User;
  res.status(200).json({ success: true, data: cleanUser(user) });
});

const updateMe = {
  username: {
    isString: {
      errorMessage: "Le nom d'utilisateur doit être une chaîne de caractères !",
    },
    notEmpty: {
      errorMessage: "Le nom d'utilisateur ne doit pas être vide !",
    },
    optional: { options: { nullable: true } },
  },
  email: {
    isEmail: {
      errorMessage: "L'adresse email doit être un email !",
    },
    notEmpty: {
      errorMessage: "L'adresse email ne doit pas être vide !",
    },
    optional: { options: { nullable: true } },
  },
};

router.put(
  '/me',
  authenticateToken,
  setUser,
  checkSchema(updateMe),
  checkForValidationErrors,
  async (req: Request, res: Response) => {
    const user = req.user as User;
    // On update l'utilisateur
    const userToSet = req.body;
    const updatedUser = await user.update({
      username: userToSet?.username,
      email: userToSet?.email,
    });
    res.status(200).json({ success: true, data: cleanUser(updatedUser) });
  },
);

router.get('/:id', authenticateToken, isAdmin, async (req, res, next) => {
  const user = await User.findOne({ where: { id: Number(req.params.id) } });
  if (user == null) {
    const error = new AppError(404, 'User non trouvé');
    return next(error);
  }
  res.status(200).json({ success: true, data: cleanUser(user) });
});

const userUpdateSchema = {
  username: {
    isString: {
      errorMessage: "Le nom d'utilisateur doit être une chaîne de caractères !",
    },
    notEmpty: {
      errorMessage: "Le nom d'utilisateur ne doit pas être vide !",
    },
    optional: { options: { nullable: true } },
  },
  email: {
    isEmail: {
      errorMessage: "L'adresse email doit être un email !",
    },
    notEmpty: {
      errorMessage: "L'adresse email ne doit pas être vide !",
    },
    optional: { options: { nullable: true } },
  },
  admin: {
    isBoolean: {
      errorMessage: 'Le champ admin doit être un booléen !',
    },
    optional: { options: { nullable: true } },
  },
  balance: {
    isFloat: {
      errorMessage: "La balance de l'utilisateur doit être un nombre !",
    },
    optional: { options: { nullable: true } },
  },
};

router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  checkSchema(userUpdateSchema),
  checkForValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findOne({ where: { id: Number(req.params.id) } });
    if (user == null) {
      const error = new AppError(404, 'User non trouvé');
      return next(error);
    }
    // On update l'utilisateur
    const userToSet = req.body;
    const updatedUser = await user.update({
      username: userToSet?.username,
      email: userToSet?.email,
      admin: userToSet?.admin,
      balance: userToSet?.balance,
    });
    res.status(200).json({ success: true, data: cleanUser(updatedUser) });
  },
);

router.delete('/:id', authenticateToken, isAdmin, async (req, res, next) => {
  const user = await User.findOne({ where: { id: Number(req.params.id) } });
  if (user == null) {
    const error = new AppError(404, 'User non trouvé');
    return next(error);
  }
  // On delete l'utilisateur
  user.destroy();
  res
    .status(200)
    .json({ success: true, message: "L'utilisateur a bien été supprimé" });
});

router.post(
  '/uploadAvatar',
  upload.single('avatar'),
  authenticateToken,
  setUser,
  async (req, res, next) => {
    const user: User = req.user;

    if (req.file == undefined) {
      const error = new AppError(400, "Image 'avatar' non trouvée");
      return next(error);
    }

    const tempPath = req.file.path;
    const fileNameTarget =
      uuidV4() + '.' + req.file?.originalname.split('.').pop();
    const targetPath = 'public/images/' + fileNameTarget;

    // Si l'utilisateur avait une image, on supprime l'ancienne
    if (user.avatar) {
      fs.unlink('public/images/' + user.avatar, (err) => {
        if (err) return next(err);
      });
      await user.update({ avatar: null });
    }

    if (
      req.file?.mimetype === 'image/png' ||
      req.file?.mimetype === 'image/jpeg'
    ) {
      fs.rename(tempPath, targetPath, async (err) => {
        if (err) return next(err);
        // On récupère l'image de la requete
        const updatedUser = await user.update({ avatar: fileNameTarget });
        res.status(200).json({ success: true, data: cleanUser(updatedUser) });
      });
    } else {
      fs.unlink(tempPath, (err) => {
        if (err) return next(err);

        res.status(403).json({
          success: false,
          error: 'Seulement les png/jpeg sont autorisés',
        });
      });
    }
  },
);

const changePasswordSchema = {
  oldPassword: {
    isString: {
      errorMessage:
        "L'ancien mot de passe doit être une chaîne de caractères !",
    },
    notEmpty: {
      errorMessage: "L'ancien mot de passe ne doit pas être vide !",
    },
    exists: {
      errorMessage: "Le champs 'oldPassword' est requis dans le body",
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
  '/changePassword',
  authenticateToken,
  setUser,
  checkSchema(changePasswordSchema),
  checkForValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    const user: User = req.user;
    const { oldPassword, newPassword, passwordConfirmation } = req.body;

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

    if (oldPassword === newPassword) {
      const error = new AppError(
        400,
        "Le mot de passe n'as pas changé ! Merci de changer de mot de passe",
      );
      return next(error);
    }

    if (!user.validPassword(oldPassword)) {
      const error = new AppError(
        400,
        "L'ancien mot de passe n'est pas le bon !",
      );
      return next(error);
    }
    user.update({ password: newPassword });
    res.status(200).json({
      success: true,
      message: 'Votre mot de passe a bien changé, vous pouvez vous reconnecter',
    });
  },
);

router.post(
  '/generateCode',
  authenticateToken,
  setUser,
  async (req, res, next) => {
    const user: User = req.user;

    let codeExist = false;
    let tries = 0;
    let code = '';

    // On essaie de créer le code (on limite le nombre d'essais a 20 pour éviter les boucles infinies)
    while (!codeExist && tries < 20) {
      code = Math.floor(Math.random() * 1001)
        .toString()
        .padStart(4, '0');

      const users_with_code = await User.findOne({ where: { code } });

      codeExist = users_with_code !== null;
      tries++;
    }

    if (codeExist) {
      const err = new AppError(
        500,
        "Impossible de créer un code pour l'utilisateur courant",
      );
      return next(err);
    }

    user.update({ code });

    res.status(200).json({
      success: true,
      data: {
        code,
      },
    });
  },
);

export default router;

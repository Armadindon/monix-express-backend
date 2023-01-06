import { Router, json } from 'express';
import {
  authenticateToken,
  isAdmin,
  setUser,
} from '../Services/AuthentificationServices';
import { User } from '../Model/User';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidV4 } from 'uuid';
import { AppError } from '..';

const router = Router();
const upload = multer({ dest: 'public/tmp/' });

router.use(json());

type CleanedUser = Partial<User>;

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

router.post('/', authenticateToken, isAdmin, async (req, res) => {
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
});

router.get('/me', authenticateToken, setUser, async (req, res) => {
  const user = req.user as User;
  res.status(200).json({ success: true, data: cleanUser(user) });
});

router.put('/me', authenticateToken, setUser, async (req, res) => {
  const user = req.user as User;
  // On update l'utilisateur
  const userToSet = req.body;
  const updatedUser = await user.update({
    username: userToSet?.username,
    email: userToSet?.email,
  });
  res.status(200).json({ success: true, data: cleanUser(updatedUser) });
});

router.get('/:id', authenticateToken, isAdmin, async (req, res, next) => {
  const user = await User.findOne({ where: { id: Number(req.params.id) } });
  if (user == null) {
    const error = new AppError(404, 'User non trouvé');
    return next(error);
  }
  res.status(200).json({ success: true, data: cleanUser(user) });
});

router.put('/:id', authenticateToken, isAdmin, async (req, res, next) => {
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
});

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
    const fileNameTarget = uuidV4() + '.png';
    const targetPath = 'public/images/' + fileNameTarget;

    // Si l'utilisateur avait une image, on supprime l'ancienne
    if (user.avatar) {
      fs.unlink('public/images/' + user.avatar, (err) => {
        if (err) return next(err);
      });
      await user.update({ avatar: null });
    }

    if (
      path.extname(req.file?.originalname as string).toLowerCase() === '.png'
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

        res
          .status(403)
          .json({ success: false, error: 'Seulement les png sont autorisés' });
      });
    }
  },
);

router.post(
  '/changePassword',
  authenticateToken,
  setUser,
  async (req, res, next) => {
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

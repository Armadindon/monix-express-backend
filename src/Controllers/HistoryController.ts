import { Router, NextFunction, Request, Response, json } from 'express';
import { History } from '../Model/History';
import {
  authenticateToken,
  isAdmin,
} from '../Services/AuthentificationServices';
import { Product } from '../Model/Product';
import { User } from '../Model/User';
import { AppError } from '..';
import { checkSchema } from 'express-validator';
import { checkForValidationErrors } from '../Services/BodyValidationService';

const router = Router();

router.use(json());

const historySchema = {
  description: {
    isString: {
      errorMessage: 'La description doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'La description ne doit pas être vide !',
    },
    exists: {
      errorMessage: "Le champs 'description' est requis dans le body",
    },
  },
  date: {
    isDate: {
      errorMessage: 'La description doit être une date !',
    },
    notEmpty: {
      errorMessage: 'La date ne doit pas être vide !',
    },
    optional: { options: { nullable: true } },
  },
  movement: {
    isFloat: {
      errorMessage: 'Le mouvement doit être un chiffre !',
    },
    exists: {
      errorMessage: "Le champs 'movement' est requis dans le body",
    },
  },
  ProductId: {
    isInt: {
      errorMessage:
        "L'identifiant du produit acheté doit être un nombre entier !",
    },
    exists: {
      errorMessage: "Le champs 'ProductId' est requis dans le body",
    },
  },
  UserId: {
    isInt: {
      errorMessage:
        "L'identifiant de l'utilisateur doit être un nombre entier !",
    },
    exists: {
      errorMessage: "Le champs 'UserId' est requis dans le body",
    },
  },
};

router.get('/', authenticateToken, isAdmin, async (req, res) => {
  const histories = await History.findAll({
    include: [Product, User],
    limit: 1000,
  });
  res.status(200).json({ success: true, data: histories });
});

router.post(
  '/',
  authenticateToken,
  isAdmin,
  checkSchema(historySchema),
  checkForValidationErrors,
  async (req: Request, res: Response) => {
    // On crée l'entrée d'historique
    const historyToSet = req.body;
    const createdHistory = await History.create({
      date: historyToSet.date,
      description: historyToSet.description,
      movement: historyToSet.movement,
      ProductId: historyToSet.ProductId,
      UserId: historyToSet.UserId,
    });
    res.status(200).json({ success: true, data: createdHistory });
  },
);

// TODO: Voir pourquoi ce endpoint doit être mit avant les autres (sinon, c'est le router.get('/:id') qui l'attrape)
router.get('/myHistory/', authenticateToken, async (req, res) => {
  const histories = await History.findAll({
    where: { UserId: req.userId },
    include: [Product],
  });
  res.status(200).json({ success: true, data: histories });
});

router.get('/:id', authenticateToken, isAdmin, async (req, res, next) => {
  const history = await History.findOne({
    where: { id: Number(req.params.id) },
    include: [{ all: true }],
  });
  if (history == null) {
    const error = new AppError(404, "Entrée d'historique non trouvée");
    return next(error);
  }
  res.status(200).json({ success: true, data: history });
});

const historySchemaUpdate = {
  description: {
    isString: {
      errorMessage: 'La description doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'La description ne doit pas être vide !',
    },
    optional: { options: { nullable: true } },
  },
  date: {
    isDate: {
      errorMessage: 'La description doit être une date !',
    },
    notEmpty: {
      errorMessage: 'La date ne doit pas être vide !',
    },
    optional: { options: { nullable: true } },
  },
  movement: {
    isFloat: {
      errorMessage: 'Le mouvement doit être un chiffre !',
    },
    optional: { options: { nullable: true } },
  },
  ProductId: {
    isInt: {
      errorMessage:
        "L'identifiant du produit acheté doit être un nombre entier !",
    },
    optional: { options: { nullable: true } },
  },
  UserId: {
    isInt: {
      errorMessage:
        "L'identifiant de l'utilisateur doit être un nombre entier !",
    },
    optional: { options: { nullable: true } },
  },
};

router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  checkSchema(historySchemaUpdate),
  checkForValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    const history = await History.findOne({
      where: { id: Number(req.params.id) },
    });
    if (history == null) {
      const error = new AppError(404, "Entrée d'historique non trouvée");
      return next(error);
    }
    // On update l'utilisateur
    const historyToSet = req.body;
    const updatedHistory = await history.update({
      date: historyToSet.date,
      description: historyToSet.description,
      movement: historyToSet.movement,
      ProductId: historyToSet.ProductId,
      UserId: historyToSet.UserId,
    });
    res.status(200).json({ success: true, data: updatedHistory });
  },
);

router.delete('/:id', authenticateToken, isAdmin, async (req, res, next) => {
  const product = await History.findOne({
    where: { id: Number(req.params.id) },
  });
  if (product == null) {
    const error = new AppError(404, "Entrée d'historique non trouvée");
    return next(error);
  }
  // On delete l'utilisateur
  product.destroy();
  res.status(200).json({
    success: true,
    message: "L'entrée d'historique a bien été supprimé",
  });
});

export default router;

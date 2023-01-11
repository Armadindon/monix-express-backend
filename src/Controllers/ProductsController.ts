import { NextFunction, Request, Response, Router, json } from 'express';
import multer from 'multer';
import { Product } from '../Model/Product';
import {
  authenticateToken,
  isAdmin,
} from '../Services/AuthentificationServices';
import { v4 as uuidV4 } from 'uuid';
import fs from 'fs';
import { AppError } from '..';
import { checkSchema } from 'express-validator';
import { checkForValidationErrors } from '../Services/BodyValidationService';

const router = Router();
const upload = multer({ dest: 'public/tmp/' });

router.use(json());

const productSchema = {
  name: {
    isString: {
      errorMessage: 'Le nom du produit doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'Le nom du produit ne doit pas être vide !',
    },
    exists: {
      errorMessage: "Le champs 'name' est requis dans le body",
    },
  },
  price: {
    isFloat: {
      options: {
        min: 0,
      },
      errorMessage: 'Le prix du produit doit être un nombre non négatif !',
    },
    exists: {
      errorMessage: "Le champs 'price' est requis dans le body",
    },
  },
  stock: {
    isInt: {
      options: {
        min: 0,
      },
      errorMessage: 'Le stock du produit doit être un nombre non négatif !',
    },
    optional: { options: { nullable: true } },
  },
  barcode: {
    isString: {
      errorMessage:
        'Le code barre du produit doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'Le code barre du produit ne doit pas être vide !',
    },
    optional: { options: { nullable: true } },
  },
};

router.get('/', authenticateToken, async (req, res) => {
  const products = await Product.findAll();
  res.status(200).json({ success: true, data: products });
});

router.post(
  '/',
  authenticateToken,
  isAdmin,
  checkSchema(productSchema),
  checkForValidationErrors,
  async (req: Request, res: Response) => {
    // On créee le produit
    const productToSet = req.body;
    const createdProduct = await Product.create({
      name: productToSet.name,
      price: productToSet.price,
      stock: productToSet.stock,
      barcode: productToSet.barcode,
    });
    res.status(200).json({ success: true, data: createdProduct });
  },
);

router.get('/:id', authenticateToken, async (req, res, next) => {
  const product = await Product.findOne({
    where: { id: Number(req.params.id) },
  });
  if (product == null) {
    const error = new AppError(404, 'Produit non trouvé');
    return next(error);
  }
  res.status(200).json({ success: true, data: product });
});

const productSchemaUpdate = {
  name: {
    isString: {
      errorMessage: 'Le nom du produit doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'Le nom du produit ne doit pas être vide !',
    },
    optional: { options: { nullable: true } },
  },
  price: {
    isFloat: {
      options: {
        min: 0,
      },
      errorMessage: 'Le prix du produit doit être un nombre non négatif !',
    },
    optional: { options: { nullable: true } },
  },
  stock: {
    isInt: {
      options: {
        min: 0,
      },
      errorMessage: 'Le stock du produit doit être un nombre non négatif !',
    },
    optional: { options: { nullable: true } },
  },
  barcode: {
    isString: {
      errorMessage:
        'Le code barre du produit doit être une chaîne de caractères !',
    },
    notEmpty: {
      errorMessage: 'Le code barre du produit ne doit pas être vide !',
    },
    optional: { options: { nullable: true } },
  },
};

router.put(
  '/:id',
  authenticateToken,
  isAdmin,
  checkSchema(productSchemaUpdate),
  checkForValidationErrors,
  async (req: Request, res: Response, next: NextFunction) => {
    const product = await Product.findOne({
      where: { id: Number(req.params.id) },
    });
    if (product == null) {
      const error = new AppError(404, 'Produit non trouvé');
      return next(error);
    }
    // On update l'utilisateur
    const productToSet = req.body;
    const updatedProduct = await product.update({
      name: productToSet.name,
      price: productToSet.price,
      stock: productToSet.stock,
      barcode: productToSet.barcode,
    });
    res.status(200).json({ success: true, data: updatedProduct });
  },
);

router.delete('/:id', authenticateToken, isAdmin, async (req, res, next) => {
  const product = await Product.findOne({
    where: { id: Number(req.params.id) },
  });
  if (product == null) {
    const error = new AppError(404, 'Produit non trouvé');
    return next(error);
  }
  // On delete l'utilisateur
  product.destroy();
  res
    .status(200)
    .json({ success: true, message: 'Le Produit a bien été supprimé' });
});

router.post(
  '/uploadImage/:id',
  upload.single('image'),
  authenticateToken,
  async (req, res, next) => {
    const product = await Product.findOne({
      where: { id: Number(req.params.id) },
    });
    if (product == null) {
      const error = new AppError(404, 'Produit non trouvé');
      return next(error);
    }

    if (req.file == undefined) {
      const error = new AppError(400, "Image 'image' non trouvée");
      return next(error);
    }

    const tempPath = req.file.path;
    const fileNameTarget =
      uuidV4() + '.' + req.file?.originalname.split('.').pop();
    const targetPath = 'public/images/' + fileNameTarget;

    // Si l'utilisateur avait une image, on supprime l'ancienne
    if (product.image) {
      fs.unlink('public/images/' + product.image, (err) => {
        if (err) return next(err);
      });
      await product.update({ image: null });
    }

    if (
      req.file?.mimetype === 'image/png' ||
      req.file?.mimetype === 'image/jpeg'
    ) {
      fs.rename(tempPath, targetPath, async (err) => {
        if (err) return next(err);
        // On récupère l'image de la requete
        const updatedProduct = await product.update({ image: fileNameTarget });
        res.status(200).json({ success: true, data: updatedProduct });
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

export default router;

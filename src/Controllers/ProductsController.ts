import { Router, json } from "express";
import multer from "multer";
import { Product } from "../Model/Product";
import { authenticateToken, isAdmin } from "../Services/AuthentificationServices";
import { v4 as uuidV4 } from "uuid";
import fs from "fs";
import path from "path";

const router = Router();
const upload = multer({ dest: "public/tmp/" });

router.use(json());

router.get("/", authenticateToken, async (req, res, next) => {
  const products = await Product.findAll();
  res.status(200).json({ sucess: true, data: products });
});

router.get("/:id", authenticateToken, async (req, res, next) => {
  const product = await Product.findOne({
    where: { id: Number(req.params.id) },
  });
  if (product == null) {
    const error = new Error("Produit non trouvé");
    return next(error);
  }
  res.status(200).json({ sucess: true, data: product });
});

router.put("/:id", authenticateToken, isAdmin, async (req, res, next) => {
  const product = await Product.findOne({
    where: { id: Number(req.params.id) },
  });
  if (product == null) {
    const error = new Error("Produit non trouvé");
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
  res.status(200).json({ sucess: true, data: updatedProduct });
});

router.delete("/:id", authenticateToken, isAdmin, async (req, res, next) => {
  const product = await Product.findOne({
    where: { id: Number(req.params.id) },
  });
  if (product == null) {
    const error = new Error("Produit non trouvé");
    return next(error);
  }
  // On delete l'utilisateur
  product.destroy();
  res
    .status(200)
    .json({ sucess: true, message: "Le Produit a bien été supprimé" });
});

router.post(
  "/uploadImage/:id",
  upload.single("image"),
  authenticateToken,
  async (req, res, next) => {
    const product = await Product.findOne({
      where: { id: Number(req.params.id) },
    });
    if (product == null) {
      const error = new Error("Produit non trouvé");
      return next(error);
    }

    if (req.file == undefined) {
      const error = new Error("Image 'image' non trouvée");
      return next(error);
    }

    const tempPath = req.file.path;
    const fileNameTarget = uuidV4() + ".png";
    const targetPath = "public/images/" + fileNameTarget;

    // Si l'utilisateur avait une image, on supprime l'ancienne
    if (product.image) {
      fs.unlink("public/images/" + product.image, (err) => {
        if (err) return next(err);
      });
      await product.update({ image: null });
    }

    if (
      path.extname(req.file?.originalname as string).toLowerCase() === ".png"
    ) {
      fs.rename(tempPath, targetPath, async (err) => {
        if (err) return next(err);
        // On récupère l'image de la requete
        const updatedProduct = await product.update({ image: fileNameTarget });
        res.status(200).json({ sucess: true, data: updatedProduct });
      });
    } else {
      fs.unlink(tempPath, (err) => {
        if (err) return next(err);

        res
          .status(403)
          .json({ success: false, error: "Seulement les png sont autorisés" });
      });
    }
  }
);


export default router;
import { Router, json } from "express";
import { History } from "../Model/History";
import {
  authenticateToken,
  isAdmin,
  setUser,
} from "../Services/AuthentificationServices";
import { Product } from "../Model/Product";
import { User } from "../Model/User";
import { AppError } from "..";

const router = Router();

router.use(json());

router.get("/", authenticateToken, isAdmin, async (req, res, next) => {
  const histories = await History.findAll({ include: [Product, User] });
  res.status(200).json({ success: true, data: histories });
});

router.post("/", authenticateToken, isAdmin, async (req, res, next) => {
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
});

// TODO: Voir pourquoi ce endpoint doit être mit avant les autres (sinon, c'est le router.get('/:id') qui l'attrape)
router.get("/myHistory/", authenticateToken, async (req, res, next) => {
  const histories = await History.findAll({
    where: { UserId: req.userId },
    include: [Product],
  });
  res.status(200).json({ success: true, data: histories });
});

router.get("/:id", authenticateToken, isAdmin, async (req, res, next) => {
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

router.put("/:id", authenticateToken, isAdmin, async (req, res, next) => {
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
});

router.delete("/:id", authenticateToken, isAdmin, async (req, res, next) => {
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

import { Router, json } from 'express';
import {
  authenticateToken,
  setUser,
} from '../Services/AuthentificationServices';
import { User } from '../Model/User';
import { Product } from '../Model/Product';
import { History } from '../Model/History';
import { AppError } from '..';
import dotenv from "dotenv"
dotenv.config()

const router = Router();
router.use(json());

const minBalance = parseInt(process.env.MIN_BALANCE as string);
const maxBalance = parseInt(process.env.MAX_BALANCE as string);

router.post('/buy', authenticateToken, setUser, async (req, res, next) => {
  const user = req.user as User;
  const { productId, amount } = req.body;

  const productBuyed = await Product.findOne({ where: { id: productId } });
  if (productBuyed === null) {
    const err = new AppError(400, "Le produit n'as pas été trouvé");
    return next(err);
  }

  //TODO: Mettre en place un warning si le produit n'as pas assez de stock

  const totalPrice = productBuyed.price * amount;
  if (minBalance > user.balance - totalPrice) {
    const err = new AppError(
      400,
      "Vous n'avez pas assez de crédit, le total de crédit que vous auriez après cet achat depasserait la dette maximale du club",
    );
    return next(err);
  }

  // On update l'utilisateur et on ajoute une entrée dans son historique
  const userUpdated = await user.update({ balance: user.balance - totalPrice });
  History.create({
    date: new Date(),
    description: `Achat ${productBuyed.name} x ${amount}`,
    movement: -totalPrice,
    ProductId: productId,
    UserId: user.id,
  });
  return res.status(200).json({ success: true, data: userUpdated });
});

router.post('/recharge', authenticateToken, setUser, async (req, res, next) => {
  const user = req.user as User;
  const { amount } = req.body;

  const totalBalance = user.balance + amount;
  if (totalBalance > maxBalance) {
    const err = new AppError(
      400,
      'Vous auriez trop de crédits, le total de crédit que vous auriez après cet achat depasserait la max du club',
    );
    return next(err);
  }

  // On update l'utilisateur et on ajoute une entrée dans son historique
  const userUpdated = await user.update({ balance: totalBalance });
  History.create({
    description: `Rechargement de ${amount} crédits`,
    movement: amount,
    UserId: user.id,
  });
  return res.status(200).json({ success: true, data: userUpdated });
});

export default router;

import { Router, json } from "express";
import { authenticateToken } from "../Services/AuthentificationServices";
import { User } from "../Model/User";

const router = Router();

router.use(json());

/** Clean the user from all the attributes that we don't want to include */
const cleanUser = (user: User) => {
  const { password: _, ...cleanedUser } = user.dataValues;
  return cleanedUser;
};

router.get("/", authenticateToken, async (req, res, next) => {
  // TODO: Mettre en place un système de droits
  const users = await User.findAll();
  const cleanedUsers: any[] = [];
  for (let i = 0; i < users.length; i++) cleanedUsers.push(cleanUser(users[i]));
  res.status(200).json({ sucess: true, data: cleanedUsers });
});

router.get("/:id", authenticateToken, async (req, res, next) => {
  // TODO: Mettre en place un système de droits
  const user = await User.findOne({ where: { id: Number(req.params.id) } });
  if (user == null) {
    const error = new Error("User non trouvé");
    return next(error);
  }
  res.status(200).json({ sucess: true, data: cleanUser(user) });
});

router.put("/:id", authenticateToken, async (req, res, next) => {
  // TODO: Mettre en place un système de droits
  const user = await User.findOne({ where: { id: Number(req.params.id) } });
  if (user == null) {
    const error = new Error("User non trouvé");
    return next(error);
  }
  // On update l'utilisateur
  const userToSet = req.body;
  const updatedUser = await user.update({
    username: userToSet?.username,
    email: userToSet?.email,
  });
  res.status(200).json({ sucess: true, data: cleanUser(updatedUser) });
});

router.delete("/:id", authenticateToken, async (req, res, next) => {
  // TODO: Mettre en place un système de droits
  const user = await User.findOne({ where: { id: Number(req.params.id) } });
  if (user == null) {
    const error = new Error("User non trouvé");
    return next(error);
  }
  // On delete l'utilisateur
  user.destroy();
  res.status(200).json({ sucess: true, message: "L'utilisateur a bien été supprimé" });
});

export default router;

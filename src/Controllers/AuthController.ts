import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../Model/User";
import { json } from "express";

const router = Router();

router.use(json());

// Handling post request
router.post("/login", async (req, res, next) => {
  console.log("AUTHENTIFICATION");
  let { username, password } = req.body;
  let existingUser;
  try {
    existingUser = await User.findOne({ where: { username } });
  } catch {
    const error = new Error(
      "Une erreur inconnue à eu lieu, merci de vérifier les paramètres de la requête"
    );
    return next(error);
  }
  if (!existingUser || !existingUser.validPassword(password)) {
    const error = Error("Impossible de se connecter");
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
      { expiresIn: "1h" }
    );
  } catch (err) {
    console.log(err);
    const error = new Error(
      "Impossible de créer le token JWT ! Merci de vérifier les paramètres de la requete"
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
router.post("/signup", async (req, res, next) => {
  const { username, password, email } = req.body;
  const newUser = User.build({ username, password, email });
  try {
    await newUser.save();
  } catch {
    const error = new Error(
      "Impossible de créer l'utilisateur ! Merci de vérifier vos paramètres"
    );
    return next(error);
  }
  let token;
  try {
    token = jwt.sign(
      { userId: newUser.id, username: newUser.username, email: newUser.email },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
  } catch (err) {
    const error = new Error(
      "Impossible de créer le token JWT ! Merci de vérifier les paramètres de la requete"
    );
    return next(error);
  }
  res.status(201).json({
    success: true,
    data: { userId: newUser.id, email: newUser.email, token: token },
  });
});

export default router;
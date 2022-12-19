import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import User from "./Model/User";
import Product from "./Model/Product";
import History from "./Model/History";
import AuthController from "./Controllers/AuthController";
import UserController from "./Controllers/UserController";
import ProductController from "./Controllers/ProductsController";
import BalanceController from "./Controllers/BalanceController";
import HistoryController from "./Controllers/HistoryController"

import swaggerConfig from "./config/swagger.json";
import { insertDummyData } from "./SetupTestData";

/** MODELS IMPORTS */

// GENERAL SETUP
dotenv.config();
const app: Express = express();
const port = process.env.PORT;

// DATABASE SETUP

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "data/db.sqlite",
});
User(sequelize);
Product(sequelize);
History(sequelize);
sequelize.sync({ force: true }).then(() => insertDummyData());

// SERVER SETUP
app.use(express.static("public"));
app.use("/documentation", swaggerUi.serve, swaggerUi.setup(swaggerConfig));
app.use("/auth", AuthController);
app.use("/users", UserController);
app.use("/products", ProductController);
app.use("/balance", BalanceController);
app.use("/history", HistoryController);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

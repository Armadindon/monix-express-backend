import express, { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import dotenv from "dotenv";
import { Sequelize } from "sequelize";
import User from "./Model/User";
import Product from "./Model/Product";
import History from "./Model/History";

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
sequelize.sync();

// SERVER SETUP
app.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(YAML.load("./src/config/swagger.yaml"))
);
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
});

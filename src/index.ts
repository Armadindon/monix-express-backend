import express, { Express, NextFunction, Request, Response } from 'express';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { Sequelize } from 'sequelize';
import UserModel, { User } from './Model/User';
import Product from './Model/Product';
import History from './Model/History';
import AuthController from './Controllers/AuthController';
import UserController from './Controllers/UserController';
import ProductController from './Controllers/ProductsController';
import BalanceController from './Controllers/BalanceController';
import HistoryController from './Controllers/HistoryController';
import cors from 'cors';
import swaggerConfig from './config/swagger.json';
import { mkdirSync, existsSync } from 'fs';

dotenv.config();

let baseUrl = process.env.BASE_URL || '';
if (baseUrl.charAt(baseUrl.length - 1) == '/')
  baseUrl = baseUrl.substring(0, baseUrl.length);
console.log(baseUrl);

// Error handlers
export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);

    Object.setPrototypeOf(this, new.target.prototype);
    this.name = Error.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this);
  }
}

const errorLogger = (
  error: AppError,
  request: Request,
  response: Response,
  next: NextFunction,
) => {
  console.error(error);
  response.status(error.statusCode).json({
    success: false,
    message: error.message,
  });
  next();
};

// GENERAL SETUP
dotenv.config();
const app: Express = express();
const port = process.env.PORT;

// DATABASE SETUP
export const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'data/db.sqlite',
  logging: false,
});
UserModel(sequelize);
Product(sequelize);
History(sequelize);
sequelize.sync().then(async () => {
  // Create admin account if it doesn't exist yet
  const admins = await User.findAll({ where: { admin: true } });
  if (admins.length === 0) {
    console.log("Pas d'admin detecté, création d'un compte admin par défaut");
    const randomPassword = (Math.random() + 1).toString(36).substring(7);
    await User.create({
      username: 'Admin',
      email: 'Admin@localhost',
      password: randomPassword,
      admin: true,
      balance: 1000,
    });
    console.log(
      `Compte admin créée : Admin / ${randomPassword}. Please note this password, it will not be relogged`,
    );
  }
});

// SERVER SETUP
swaggerConfig.servers[0].url = baseUrl;
app.use(
  cors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  }),
);
app.use(baseUrl, express.static(`public`));
if (!existsSync('public/images')) mkdirSync('public/images');
app.use(
  `${baseUrl}/documentation`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerConfig),
);
app.use(`${baseUrl}/auth`, AuthController);
app.use(`${baseUrl}/users`, UserController);
app.use(`${baseUrl}/products`, ProductController);
app.use(`${baseUrl}/balance`, BalanceController);
app.use(`${baseUrl}/history`, HistoryController);
app.use(errorLogger);

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});

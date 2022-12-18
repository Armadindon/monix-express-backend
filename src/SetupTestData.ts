import { History } from "./Model/History";
import { Product } from "./Model/Product";
import { User } from "./Model/User";

const cleanDatabase = async () => {
  (await User.findAll()).forEach((user) => user.destroy());
  (await Product.findAll()).forEach((user) => user.destroy());
  (await History.findAll()).forEach((user) => user.destroy());
};

export const insertDummyData = async () => {
  await cleanDatabase();
  // Users
  User.build({
    username: "Armadindon",
    email: "Armadindon@gmail.com",
    password: "Test1234",
  }).save();
  User.build({
    username: "Proutyx",
    email: "Proutyx@gmail.com",
    password: "Test1234",
  }).save();

  // Products
  Product.build({
    name: "Bueno",
    price: 1,
    stock: 0,
  }).save();
  Product.build({
    name: "Pizza",
    price: 2,
    stock: 10,
  }).save();
};

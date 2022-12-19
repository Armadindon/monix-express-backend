import { History } from "./Model/History";
import { Product } from "./Model/Product";
import { User } from "./Model/User";

const cleanDatabase = async () => {
  await User.destroy({ where: {}, truncate: true });
  await Product.destroy({ where: {}, truncate: true });
  await History.destroy({ where: {}, truncate: true });
};

export const insertDummyData = async () => {
  await cleanDatabase();
  // Users
  const user1 = await User.create({
    username: "Armadindon",
    email: "Armadindon@gmail.com",
    password: "Test1234",
  });
  const user2 = await User.create({
    username: "Proutyx",
    email: "Proutyx@gmail.com",
    password: "Test1234",
  });

  // Products
  const product1 = await Product.create({
    name: "Bueno",
    price: 1,
    stock: 0,
  });
  const product2 = await Product.create({
    name: "Pizza",
    price: 2,
    stock: 10,
  });

  // Histories
  await History.create({
    UserId: user1.id,
    ProductId: product1.id,
    date: new Date(),
    description: "Test Historique 1",
    movement: 2,
  });
  await History.create({
    UserId: user2.id,
    ProductId: product2.id,
    date: new Date(),
    description: "Test Historique 1",
    movement: 4,
  });
};

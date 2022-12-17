import { User } from "./User";
import { Product } from "./Product";
import { DataTypes, Model, Sequelize } from "sequelize";

export class History extends Model {
  declare user: User;
  declare product: Product;
  declare movement: number;
  declare description: string;
  declare date: Date;
}

export default (sequelize: Sequelize) => {
  History.init({
    movement: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING,
      allowNull: false
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: new Date()
    },
  }, {sequelize})

  // Creations of the associations
  User.hasMany(History);
  History.belongsTo(User);

  Product.hasMany(History);
  History.belongsTo(Product);
}
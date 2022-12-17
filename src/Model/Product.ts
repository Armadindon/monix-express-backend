import { DataTypes, Model, Sequelize } from "sequelize";

export class Product extends Model {
  declare name: string;
  declare price: number;
  declare stock: number;
  declare image: string | null;
  declare barcode: string | null;
}

export default (sequelize: Sequelize) => {
  Product.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    image: {
      type: DataTypes.STRING,
    },
    barcode: {
      type: DataTypes.STRING,
    },
  }, {sequelize})
}
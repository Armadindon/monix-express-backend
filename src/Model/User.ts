import { DataTypes, Model, Sequelize } from "sequelize";
import { History } from "./History";

export class User extends Model {
  declare username: string;
  declare email: string;
  declare password: string;
  declare balance: string;
  declare avatar: string | null;
}

export default (sequelize: Sequelize) => {
  User.init({
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 0
    },
    balance: {
      type: DataTypes.FLOAT,
    },
    avatar: {
      type: DataTypes.STRING,
    },
  }, {sequelize})
}
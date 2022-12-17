import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";
import { History } from "./History";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  // id can be undefined during creation when using `autoIncrement`
  declare id: CreationOptional<number>;
  declare username: string;
  declare email: string;
  declare password: string;
  declare balance: string;
  declare avatar: string | null;
  declare histories: NonAttribute<History[]>;
}

export default (sequelize: Sequelize) => {
  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false, defaultValue: 0 },
      balance: { type: DataTypes.FLOAT },
      avatar: { type: DataTypes.STRING },
    },
    { sequelize }
  );
};

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
import bcrypt from "bcrypt";

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  // id can be undefined during creation when using `autoIncrement`
  declare id: CreationOptional<number>;
  declare username: string;
  declare email: string;
  declare password: string;
  declare balance: CreationOptional<number>;
  declare avatar: string | null;
  declare admin: CreationOptional<boolean>;
  declare histories: NonAttribute<History[]>;

  public validPassword(password: string): boolean {
    return bcrypt.compareSync(password, this.password);
  }
}

export default (sequelize: Sequelize) => {
  User.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      username: { type: DataTypes.STRING, allowNull: false },
      email: { type: DataTypes.STRING, allowNull: false },
      password: { type: DataTypes.STRING, allowNull: false, defaultValue: 0 },
      balance: { type: DataTypes.FLOAT, defaultValue: 0 },
      avatar: { type: DataTypes.STRING },
      admin: { type: DataTypes.BOOLEAN, defaultValue: false },
    },
    {
      sequelize,
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            const salt = await bcrypt.genSaltSync(10, "a");
            user.password = bcrypt.hashSync(user.password, salt);
          }
        },
        beforeUpdate: async (user) => {
          const previousPassword = user.previous().password;
          // On verifie que le mot de passe a bien changé pour éviter de crypter une deuxième fois le mdp
          if (
            user.password &&
            previousPassword &&
            user.password !== previousPassword
          ) {
            const salt = await bcrypt.genSaltSync(10, "a");
            user.password = bcrypt.hashSync(user.password, salt);
          }
        },
      },
    }
  );
};

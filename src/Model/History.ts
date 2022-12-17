import { User } from "./User";
import { Product } from "./Product";
import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
} from "sequelize";

export class History extends Model<
  InferAttributes<History>,
  InferCreationAttributes<History>
> {
  declare id: CreationOptional<number>;

  // User
  declare userId: NonAttribute<number>;
  declare user: NonAttribute<User>;

  // Product
  declare productId: NonAttribute<number>;
  declare product: NonAttribute<Product>;

  declare movement: number;
  declare description: string;
  declare date: Date;
}

export default (sequelize: Sequelize) => {
  History.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      movement: { type: DataTypes.FLOAT, allowNull: false },
      description: { type: DataTypes.STRING, allowNull: false },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: new Date(),
      },
    },
    { sequelize }
  );

  // Creations of the associations
  User.hasMany(History, {
    sourceKey: "id",
    foreignKey: "ProductId",
    as: "user",
  });
  History.belongsTo(User);

  Product.hasMany(History, {
    sourceKey: "id",
    foreignKey: "UserId",
    as: "product",
  });
  History.belongsTo(Product);
};

import { User } from './User';
import { Product } from './Product';
import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
  Sequelize,
  NOW,
} from 'sequelize';

export class History extends Model<
  InferAttributes<History>,
  InferCreationAttributes<History>
> {
  declare id: CreationOptional<number>;

  // User
  declare UserId: ForeignKey<number>;
  declare user: NonAttribute<User>;

  // Product
  declare ProductId: CreationOptional<ForeignKey<number>>;
  declare product: NonAttribute<Product>;

  declare movement: number;
  declare description: string;
  declare date: CreationOptional<Date>;

  declare getUser: () => User;
  declare getProduct: () => Product;
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
        defaultValue: NOW,
      },
    },
    { sequelize },
  );

  // Creations of the associations
  User.hasMany(History);
  History.belongsTo(User);

  Product.hasMany(History);
  History.belongsTo(Product);
};

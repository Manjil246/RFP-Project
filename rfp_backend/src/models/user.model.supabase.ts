// How models created at production level using TypeScript and Supabase

// import { DataTypes, Model, Optional } from "sequelize";
// import { PostgresDB } from "../config/connectToPostgres"; // your singleton PostgresDB class

// // --------------------
// // 1. Attributes
// // --------------------
// export interface IUser {
//   id: number;
//   fullName: string;
//   email: string;
//   isActive: boolean;
//   isUserVerified: boolean;
//   createdAt?: Date;
//   updatedAt?: Date;
// }

// // Attributes required to create a new user
// export interface CreateUserAttributes
//   extends Optional<
//     IUser,
//     "id" | "isActive" | "isUserVerified" | "createdAt" | "updatedAt"
//   > {}

// // Attributes for updates (all optional)
// export interface UpdateUserAttributes extends Partial<CreateUserAttributes> {}

// // --------------------
// // 2. Model Definition
// // --------------------
// export class User extends Model<IUser, CreateUserAttributes> implements IUser {
//   public id!: number;
//   public fullName!: string;
//   public email!: string;
//   public isActive!: boolean;
//   public isUserVerified!: boolean;

//   // timestamps
//   public readonly createdAt!: Date;
//   public readonly updatedAt!: Date;
// }

// // --------------------
// // 3. Initialize
// // --------------------
// User.init(
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//       field: "id",
//     },
//     fullName: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       field: "full_name",           
//     },
//     email: {
//       type: DataTypes.STRING,
//       allowNull: false,
//       unique: true,
//       field: "email",
//     },
//     isUserVerified: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: false,
//       field: "is_user_verified",
//     },
//     isActive: {
//       type: DataTypes.BOOLEAN,
//       defaultValue: true,
//       field: "is_active",
//     },
//   },
//   {
//     sequelize: PostgresDB.getInstance().sequelize, // <-- same singleton instance
//     modelName: "User",
//     tableName: "users",
//     timestamps: true,
//   }
// );

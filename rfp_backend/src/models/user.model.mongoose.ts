// how models are created at production level using Mongoose and TypeScript
// import { Document, model, Schema } from "mongoose";

// export interface IUser extends Document {
//   fullName: string;
//   email: string;
//   isActive?: boolean;
//   isUserVerified?: boolean;
// }

// // Attributes required to create a new user
// export interface CreateUserAttributes extends Omit<IUser, "_id"> {}

// // Partial makes all fields optional for updates
// export interface UpdateUserAttributes extends Partial<CreateUserAttributes> {}

// const userModelSchema = new Schema<IUser>(
//   {
//     fullName: {
//       type: String,
//       required: true,
//     },
//     email: {
//       type: String,
//       required: true,
//     },
//     isUserVerified: {
//       type: Boolean,
//       default: false,
//     },
//     isActive: {
//       type: Boolean,
//       default: true,
//     },
//   },
//   {
//     timestamps: true,
//     collection: "users",
//   }
// );

// export const UserModel = model<IUser>("users", userModelSchema);

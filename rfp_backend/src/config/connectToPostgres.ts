// To use this run below commands in terminal
// npm install sequelize pg pg-hstore OR bun add sequelize pg pg-hstore
// npm install --save-dev @types/sequelize OR bun add -d @types/sequelize

// import { Sequelize } from "sequelize";
// import {
//   DB_HOSTNAME,
//   DB_NAME,
//   DB_PASSWORD,
//   DB_PORT,
//   DB_USER,
// } from "./imports";

// export class PostgresDB {
//   private static instance: PostgresDB;
//   private sequelize: Sequelize;

//   private constructor() {
//     const timescaleDbURI = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOSTNAME}:${DB_PORT}/${DB_NAME}`;

//     this.sequelize = new Sequelize(timescaleDbURI, {
//       dialect: "postgres",
//       protocol: "postgres",
//       logging: false,
//       dialectOptions: {
//         ssl: {
//           require: true,
//           rejectUnauthorized: false,
//         },
//       },
//     });
//   }

//   public static getInstance(): PostgresDB {
//     if (!PostgresDB.instance) {
//       PostgresDB.instance = new PostgresDB();
//     }
//     return PostgresDB.instance;
//   }

//   public async connect(): Promise<void> {
//     try {
//       await this.sequelize.authenticate();
//       console.log("✅ Connected to TimescaleDB");
//     } catch (error) {
//       console.error("❌ Failed to connect to TimescaleDB:", error);
//       process.exit(1);
//     }
//   }

//   public async disconnect(): Promise<void> {
//     try {
//       await this.sequelize.close();
//       console.log("🔌 Disconnected from TimescaleDB");
//     } catch (error) {
//       console.error("❌ Failed to disconnect from TimescaleDB:", error);
//     }
//   }

//   public getSequelize(): Sequelize {
//     return this.sequelize;
//   }
// }


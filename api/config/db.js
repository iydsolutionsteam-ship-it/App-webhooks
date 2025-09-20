import mongoose from "mongoose";

const connectDB = (dbName = "", dbUrl = "") => {
  const conn = mongoose.createConnection(dbUrl, {});
  conn.on("connected", () => {
    console.log(`${dbName} MongoDB Connected: ${conn.host}`);
  });
  conn.on("error", (err) => {
    console.error(`Error connecting to ${dbName}: ${err.message}`);
  });
  return conn;
};

export default connectDB;

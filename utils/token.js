import jwt from "jsonwebtoken";
import "dotenv/config";



const { ACCESS_TOKEN_SECRET } = process.env;

export const createAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "7d" }); // Token expires in 7 days
};

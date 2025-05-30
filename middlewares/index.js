import jwt from "jsonwebtoken";
import User from "../models/User.js";

const { ACCESS_TOKEN_SECRET } = process.env;

export const verifyAccessToken = async (req, res, next) => {
    const authHeader = req.header("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(400).json({ status: false, msg: "Token not found or malformed" });
    }

    const token = authHeader.split(" ")[1]; // remove 'Bearer '

    let user;
    try {
        user = jwt.verify(token, ACCESS_TOKEN_SECRET);
    } catch (err) {
        return res.status(401).json({ status: false, msg: "Invalid token" });
    }

    try {
        const foundUser = await User.findByPk(user.id);
        if (!foundUser) {
            return res.status(401).json({ status: false, msg: "User not found" });
        }

        req.user = foundUser;
        console.log("✅ Token verified, moving on...");
        next();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ status: false, msg: "Internal Server Error" });
    }
};

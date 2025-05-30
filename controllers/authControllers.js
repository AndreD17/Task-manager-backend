import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { createAccessToken } from "../utils/token.js";
import { validateEmail } from "../utils/validation.js";
import logger from "../utils/logger.js";


export const signup = async (req, res) => {
    try {
        logger.info("Signup attempt initiated")
        const { name, email, password } = req.body;
    

        if (!name || !email || !password)  {
            logger.warn("signup atttempt failed due to missing name, email or password")
            return res.status(400).json({ msg: "Please fill all the fields" });
        }
        
        
        if (typeof name !== "string" || typeof email !== "string" || typeof password !==  "string") {
            return res.status(400).json({ msg: "Please send string values only, intergers can only be sent for passwords" });
        }
        
        
        if (password.length < 4) {
            logger.warn(`Password length is less than 4 characters for email: ${email}`);
            return res.status(400).json({ msg: "Password length must be at least 4 characters" });
        }
        
       
        if (!validateEmail(email)) {
            logger.warn(`Invalid email format: ${email}`);
            return res.status(400).json({ msg: "Invalid Email" });
        }
         
       
        // ✅ Corrected findOne query
        const user = await User.findOne({ where: { email } });

        if (user) {
            logger.warn(`User already exists with email: ${email}`)
            return res.status(400).json({ msg: "This email is already registered, ensure you use unique credentials" });
        }
        
        
        const hashedPassword = await bcrypt.hash(password, 10);
        if (!hashedPassword){
            logger.warn("Password hashing has failed")
            return res.status(500).json({ message: "Internal Server Error"});
        }

        await User.create({ name, email, password: hashedPassword });
        logger.info("User created successfully:" );
        res.status(201).json({ msg: "Congratulations!! Account has been created for you." });
    } catch (err) {
        logger.error("Error during signup:", err)
        return res.status(500).json({ msg: "Internal Server Error" });
    }
};


export const login = async (req, res) => {
    try {
        logger.info(`login attempt initiated for user with email: ${req.body.email}`);
        const { email, password } = req.body;
        if(email && !password) {
            logger.warn("This is an active user email but the password is incorrect, please check and try again");
            return res.status(200).json({ status: false, msg: " Please enter a valid password"})
        }
        if (!email || !password) {
            logger.warn("login attempt failed due to missing email or password");
            return res.status(400).json({ status: false, msg: "Please enter all details!!" });
        }

        // ✅ Corrected findOne query
        const user = await User.findOne({ where: { email } });

        if (!user) {
            logger.warn(`login attempt failed for user with email: ${email}`);
            return res.status(400).json({ status: false, msg: "This email is not registered!!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`login attempt failed for user: ${user.id}`);
            return res.status(400).json({ status: false, msg: "Password incorrect!!" });
        }

        // ✅ Corrected user ID reference
        const token = createAccessToken({ id: user.id });

        logger.info(`User logged in: ${user.id}`);
        res.status(200).json({ token, user, status: true, msg: "Login successful." });
    } catch (err) {
        logger.error(err);
        return res.status(500).json({ status: false, msg: "Internal Server Error" });
    }
};

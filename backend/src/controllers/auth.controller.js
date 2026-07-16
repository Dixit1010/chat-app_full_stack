import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { signupSchema, loginSchema, updateProfileSchema } from "../lib/validation.js";

export const signup = async (req, res, next) => {
  try {
    const validatedData = signupSchema.parse(req.body);
    const { fullName, email, password, username } = validatedData;

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) return res.status(400).json({ message: "Username already taken" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      username,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.username) {
        return res.status(400).json({ message: "Username already taken" });
      }
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ message: error.issues[0].message });
    }
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;
    
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    if (error.name === "ZodError") {
      return res.status(400).json({ message: error.issues[0].message });
    }
    next(error);
  }
};

export const logout = (req, res, next) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const { profilePic, username, about } = validatedData;
    const userId = req.user._id;

    const updates = {};
    if (profilePic) {
      const uploadResponse = await cloudinary.uploader.upload(profilePic);
      updates.profilePic = uploadResponse.secure_url;
    }
    if (username) updates.username = username;
    if (about !== undefined) updates.about = about;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(400).json({ message: "Username already taken" });
    }
    if (error.name === "ZodError") {
      return res.status(400).json({ message: error.issues[0].message });
    }
    next(error);
  }
};

export const checkAuth = (req, res, next) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    next(error);
  }
};

export const subscribeToPush = async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription?.endpoint) {
      return res.status(400).json({ message: "Invalid push subscription" });
    }
    req.user.pushSubscription = subscription;
    await req.user.save();
    res.status(200).json({ message: "Subscribed to push notifications" });
  } catch (error) {
    console.log("Error in subscribeToPush controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePublicKey = async (req, res) => {
  try {
    const { publicKey } = req.body;
    req.user.publicKey = publicKey;
    await req.user.save();
    res.status(200).json({ message: "Public key updated successfully" });
  } catch (error) {
    console.log("Error in updatePublicKey controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


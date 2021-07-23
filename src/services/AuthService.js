import { Client } from "../models/client.js";
import {
  checkPassword,
  encryptPassword,
  generateToken,
} from "../utils/authUtils.js";
import crypto from "crypto";
import { errorResponse, successResponse } from "../cors/responseHandler.js";

const AuthService = {
  signup: async (data, params, query, req, res) => {
    const existingUser = await Client.findOne({
      $or: [{ contactNumber: data.contactNumber }, { email: data.email }],
    }).exec();
    if (existingUser) {
      res.status(400).send(errorResponse(404));
      return;
    }
    const salt = crypto.randomBytes(32).toString("hex");
    const hashedPassword = encryptPassword(data.password, salt);
    data.password = hashedPassword;
    data.salt = salt;
    const user = new Client(data);
    await user.save();
    res.status(201).send(
      successResponse(200, "Created successfully", {
        user
      })
    );
  },
  login: async (data, params, query, req, res) => {
    try {
      const user = await Client.findOne({
        $or: [{ contactNumber: data.username }, { email: data.username }],
      }).exec();
      if (!user) {
        res.status(404).send(errorResponse(407));
        return;
      }
      const valid = checkPassword(data.password, user.salt, user.password);
      if (!valid) {
        res.status(405).send(errorResponse(405));
        return;
      }
      const token = generateToken(user._id);
      res.status(201).send(
        successResponse(200, "Login Success", {
          token,
          user,
        })
      );
    } catch (err) {
      res.status(500).send(errorResponse(500));
    }
  },
};

export default AuthService;
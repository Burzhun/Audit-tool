const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
var userSchema = require("../models/userSchema");
const mongoose = require("mongoose");
dotenv.config();
const secret = process.env.AUTH_SECRET;
const NODE_ENV = process.env.NODE_ENV;

function VerifyToken(req, res, next) {
    // if (NODE_ENV === 'test') {
    //   req.userId = 1;
    //   next();
    //   return
    // }
    var token = req.headers["x-access-token"];

    //for unit testing components that make requests
    if (token === "unit_test_token" && process.env.REACT_APP_PROD === "0") {
        req.userId = 10;
        req.user_email = "burzhun@gmail.com";
        req.user_role = "Admin";
        next();
        return;
    }
    if (token && token.startsWith("Bearer ")) {
        // Remove Bearer from string
        token = token.replace("Bearer ", "");
    }

    if (!token || token === undefined) {
        if (req.headers["cookie"]) {
            token = req.headers["cookie"].split("; ").filter((item) => item.startsWith("token"))[0];

            if (token) {
                // Remove Bearer from string
                token = token.replace("token=", "");
            }
        }
    }
    if (!token) {
        return res.status(403).send({ auth: false, message: "No token provided." });
    }
    jwt.verify(token, secret, function (err, decoded) {
        if (err) {
            return res.status(403).send({ auth: false, message: "Failed to authenticate token." });
        }
        // if everything good, save to request for use in other routes
        req.userId = decoded.user_id;
        req.user_email = decoded.email;
        req.user_role = decoded.role || "internal";
        next();
    });
}

function VerifyAdmin(req, res, next) {
    if (req.user_role && (req.user_role === "Admin" || req.user_role === "Manager")) {
        next();
        return;
    }
    const user_model = mongoose.model("User", userSchema, "User");
    user_model.findOne({ UserId: req.userId }).then((result) => {
        if (!result || result.role !== "Admin") {
            return res.status(403).send({ auth: false, message: "Failed to authenticate token." });
        }
        next();
    });
}
module.exports = { VerifyToken, VerifyAdmin };

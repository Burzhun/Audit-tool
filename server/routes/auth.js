const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
dotenv.config();
const utils = require("./utils");

const secret = process.env.AUTH_SECRET;
const saltRounds = 10;

exports.register = function (req, res) {
    res.send({
        success: false,
        status: "USER_EXISTS"
    });
    return;
    var register_date = new Date();
    register_date = register_date.toISOString();
    const hash = bcrypt.hashSync(req.body.password, saltRounds);
    const userSchema = utils.getUserSchema();
    userSchema.findOne({ RegisteredUserEmail: req.body.email }).then((result) => {
        if (!result) {
            let NewUser = new userSchema({
                FirstName: req.body.first_name,
                LastName: req.body.last_name,
                RegisteredDate: register_date,
                LastSuccessfulLogin: null,
                RegisteredUserEmail: req.body.email,
                PasswordHashed: hash,
                role: "new"
            });

            NewUser.save()
                .then((result) => {
                    res.send({
                        success: true
                    });
                })
                .catch((error) => {
                    res.send({
                        success: false,
                        err: error
                    });
                });
        } else {
            res.send({
                success: false,
                status: "USER_EXISTS"
            });
        }
    });
};

exports.login = function (req, res) {
    const { email, password } = req.body;
    const last_login = new Date().toISOString();
    const userSchema = utils.getUserSchema();
    userSchema
        .findOne({ RegisteredUserEmail: email })
        .then((result) => {
            if (bcrypt.compareSync(password, result.PasswordHashed)) {
                if (result["role"] === "new") {
                    res.send({
                        success: false,
                        status: "NO_ACCESS"
                    });
                    return;
                }
                result.updateOne({ LastSuccessfulLogin: last_login }).exec();
                var user = {
                    user_id: result.UserId,
                    first_name: result.FirstName,
                    last_name: result.LastName,
                    email: result.RegisteredUserEmail,
                    role: result.role,
                    location: result.Location || "",
                    Upwork_Id: result.Upwork_Id || "",
                    Upwork_Profile_Id: result.Upwork_Profile_Id || ""
                };

                jwt.sign(
                    user,
                    secret,
                    {
                        expiresIn: "7 days"
                    },
                    (err, token) => {
                        res.cookie("token", token, {
                            expires: new Date(Date.now() + 7 * 24 * 3600 * 1000),
                            httpOnly: true
                        }).json({
                            success: true,
                            status: "success",
                            token: token
                        });
                    }
                );
            } else {
                res.send({
                    success: false,

                    status: "PASSWORD_INCORRECT"
                });
            }
        })
        .catch((error) => {
            res.send({
                success: false,
                status: "USER_NOT_FOUND"
            });
        });
};
exports.changePassword = function (req, res) {
    const { user_id, old_password, new_password } = req.body;
    if (!old_password || !new_password || !user_id) {
        res.send({
            success: true
        });
        return;
    }

    const userSchema = utils.getUserSchema();
    userSchema.findOne({ UserId: user_id }).then((result) => {
        if (bcrypt.compareSync(old_password, result.PasswordHashed)) {
            const hash = bcrypt.hashSync(new_password, saltRounds);
            result.PasswordHashed = hash;
            result.updateOne(result).exec(function (err) {
                if (err) {
                    res.send({
                        error: err,
                        success: false
                    });
                } else
                    res.send({
                        success: true
                    });
            });
        } else {
            res.send({
                success: false,

                status: "PASSWORD_INCORRECT"
            });
        }
    });
};

exports.resetPassword = function (req, res) {
    const { email, new_password } = req.body;
    if (!email || !new_password) {
        res.send({
            success: false
        });
        return;
    }

    const userSchema = utils.getUserSchema();
    userSchema.findOne({ RegisteredUserEmail: email }).then((result) => {
        const hash = bcrypt.hashSync(new_password, saltRounds);
        if (result.role !== "Admin") result.PasswordHashed = hash;
        result.updateOne(result).exec(function (err) {
            if (err) {
                res.send({
                    success: false
                });
            } else
                res.send({
                    success: true
                });
        });
    });
};

exports.setAccess = function (req, res) {
    const { email, type } = req.body;
    const userSchema = utils.getUserSchema();
    if (email && type) {
        userSchema.findOne({ RegisteredUserEmail: email }).then((user) => {
            if (user) {
                user.updateOne({ role: type === 1 ? "" : "new" }).exec();
                res.send({
                    success: true
                });
            } else {
                res.send({
                    success: false,
                    not_found: true
                });
            }
        });
    } else
        res.send({
            success: false
        });
};

exports.newUsers = function (req, res) {
    const userSchema = utils.getUserSchema();
    if (req.query.count) {
        userSchema.countDocuments({ role: "new" }).exec((err, count) => {
            res.send({
                success: true,
                count: count
            });
        });
    } else {
        userSchema.find({ role: "new" }).then((users) => {
            res.send({
                success: true,
                users: users
            });
        });
    }
};

exports.externalUsers = function (req, res) {
    const userSchema = utils.getUserSchema();
    userSchema
        .find({ role: "external" })
        .select(["UserId", "role", "FirstName", "LastName", "Location", "Upwork_Id", "Upwork_Profile_Id", "RegisteredUserEmail", "AccessableCollections"])
        .then((users) => {
            res.send({
                success: true,
                users: users
            });
        });
};

exports.externalUsersEmail = function (req, res) {
    const userSchema = utils.getUserSchema();
    userSchema
        .find({ role: "external" })
        .select(["RegisteredUserEmail"])
        .then((users) => {
            res.send({
                success: true,
                users: users
            });
        });
};

exports.internalUsers = function (req, res) {
    const userSchema = utils.getUserSchema();
    userSchema
        .find({ role: req.query.manager ? "Manager" : "" })
        .select(["UserId", "role", "FirstName", "LastName", "Location", "Upwork_Id", "Upwork_Profile_Id", "RegisteredUserEmail", "AccessableCollections"])
        .then((users) => {
            res.send({
                success: true,
                users: users
            });
        });
};

exports.adminUsers = function (req, res) {
    const userSchema = utils.getUserSchema();
    userSchema
        .find({ role: "Admin" })
        .select(["UserId", "role", "FirstName", "LastName", "Location", "Upwork_Id", "Upwork_Profile_Id", "RegisteredUserEmail", "AccessableCollections"])
        .then((users) => {
            res.send({
                success: true,
                users: users
            });
        });
};

exports.setExternalUserRecords = function (req, res) {
    const userSchema = utils.getUserSchema();
    const data = req.body.data;
    const email = req.body.email;
    //console.log(req.user_role);
    userSchema.findOne({ RegisteredUserEmail: email }).then((user) => {
        if (user) {
            user.updateOne({ AccessableCollections: data }).exec();
            res.send({
                success: true
            });
        } else {
            res.send({
                success: false,
                not_found: true
            });
        }
    });
};

exports.deleteUser = function (req, res) {
    const userSchema = utils.getUserSchema();
    if (req.body.email) {
        const email = req.body.email;
        userSchema.deleteOne({ RegisteredUserEmail: email }).exec((err, count) => {
            res.send({
                success: !err
            });
        });
    }
};

exports.createUser = function (req, res) {
    const userSchema = utils.getUserSchema();
    var register_date = new Date();
    register_date = register_date.toISOString();
    let password = Math.random().toString(36).substring(5);
    const hash = bcrypt.hashSync(password, saltRounds);
    let usertype = req.body.usertype === "External" ? "external" : req.body.usertype;
    if (usertype === "Internal") usertype = "";
    if (req.user_role === "Manager") usertype = "external";
    userSchema.findOne({ RegisteredUserEmail: req.body.email }).then((result) => {
        if (!result) {
            let NewUser = new userSchema({
                FirstName: req.body.first_name,
                LastName: req.body.last_name,
                RegisteredDate: register_date,
                LastSuccessfulLogin: null,
                RegisteredUserEmail: req.body.email,
                PasswordHashed: hash,
                role: usertype,
                Location: req.body.location || "",
                Upwork_Id: req.body.Upwork_Id || "",
                Upwork_Profile_Id: req.body.Upwork_Profile_Id || ""
            });

            NewUser.save()
                .then((result) => {
                    res.send({
                        success: true,
                        password: password,
                        email: req.body.email
                    });
                })
                .catch((error) => {
                    res.send({
                        success: false,
                        status: "error"
                    });
                });
        } else {
            res.send({
                success: false,
                status: "USER_EXISTS"
            });
        }
    });
};

exports.updateUserFields = function (req, res) {
    const userSchema = utils.getUserSchema();
    const data = req.body.data;
    const email = req.body.email;
    //console.log(req.user_role);
    userSchema.findOne({ RegisteredUserEmail: email }).then((user) => {
        if (user) {
            if (data.role === "internal") data.role = "";
            if (req.user_role === "Manager") {
                if (user.role !== "external") {
                    res.send({
                        success: false
                    });
                    return;
                }
                data.role = "external";
            }
            user.updateOne(data).exec();
            res.send({
                success: true
            });
        } else {
            res.send({
                success: false,
                not_found: true
            });
        }
    });
};

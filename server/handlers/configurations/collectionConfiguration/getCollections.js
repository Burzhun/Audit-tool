const { Configuration } = require("../../../admin_models");
const jwt = require("jsonwebtoken");
const revision = require("../../../revision");

const buildNumber = revision.getBuildNumber();

module.exports = async (req, res, next) => {
    try {
        var token = req.headers["x-access-token"];
        const secret = process.env.AUTH_SECRET;
        const user_type = req.body.user_type || "internal";
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
            return res.send({ auth: false, message: "No token provided." });
        }
        jwt.verify(token, secret, async function (err, decoded) {
            if (err) {
                return res.send({ auth: false, message: "Failed to authenticate token." });
            }

            let query = { user_type };
            if (decoded.role === "Manager") {
                query["ManagerAccessible"] = true;
                query["user_type"] = "internal";
            }
            const collections = await Configuration.find(query).distinct("CollectionRelevantFor");

            res.send({
                userName: decoded.role === "Admin" || decoded.role === "Manager" ? decoded.first_name : undefined,
                revision: buildNumber,
                collections: collections
            });
        });
    } catch (e) {
        next(e);
    }
};

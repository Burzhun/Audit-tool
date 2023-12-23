const express = require("express");
var { VerifyToken, VerifyAdmin } = require("./middleware/verify");
var routes = require("./routes");
const users = require("./routes/users");
var auth = require("./routes/auth");

const router = express.Router();
router.use("/users", users);
router.get("/", routes.index);
router.post("/database/fetchDatabase", VerifyToken, routes.fetchDatabase);
router.post("/database/saveFunction", VerifyToken, routes.saveFunction);
router.post("/database/getRecord", VerifyToken, routes.getRecord);
router.get("/database/fetchImage", VerifyToken, routes.fetchImage);
router.get("/database/fetchImageEdit", VerifyToken, routes.fetchImage);
router.get("/database/fetchConfig", VerifyToken, routes.fetchConfig);
router.post("/database/saveDatabase", VerifyToken, routes.saveDatabase);
router.post("/database/globalUpdate", VerifyToken, routes.globalUpdate);
router.post("/database/globalUpdateAll", VerifyToken, routes.globalUpdateAll);
router.get("/database/getConfigs", VerifyToken, routes.getConfigs);
router.post("/database/copy", VerifyToken, routes.copyRecord);
router.post("/database/removeFile", VerifyToken, routes.removeFile);
router.post("/database/uploadFile", VerifyToken, routes.uploadFile);
router.post("/database/addRecord", VerifyToken, routes.addRecord);
router.post("/database/setUserConfig", VerifyToken, routes.setUserConfig);
router.get("/database/showLog", VerifyToken, VerifyAdmin, routes.showLog);
router.post("/auth/register", auth.register);
router.post("/auth/login", auth.login);
router.get("/auth/new-users", VerifyToken, VerifyAdmin, auth.newUsers);
router.post("/user-manager", VerifyToken, VerifyAdmin, auth.setAccess);
router.post("/auth/deleteUser", VerifyToken, VerifyAdmin, auth.deleteUser);
router.post("/auth/changePassword", VerifyToken, auth.changePassword);
router.post("/auth/createUser", VerifyToken, VerifyAdmin, auth.createUser);
router.post(
    "/auth/resetPassword",
    VerifyToken,
    VerifyAdmin,
    auth.resetPassword
);
router.get("/auth/internalUsers", VerifyToken, VerifyAdmin, auth.internalUsers);
router.get("/auth/adminUsers", VerifyToken, VerifyAdmin, auth.adminUsers);
router.get("/auth/externalUsers", VerifyToken, VerifyAdmin, auth.externalUsers);
router.get("/auth/externalUsersEmail", VerifyToken, auth.externalUsersEmail);
router.post(
    "/auth/setExternalUserRecords",
    VerifyToken,
    VerifyAdmin,
    auth.setExternalUserRecords
);
router.post(
    "/auth/updateUserFields",
    VerifyToken,
    VerifyAdmin,
    auth.updateUserFields
);

module.exports = router;

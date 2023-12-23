const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const dotenv = require("dotenv");
var cors = require("cors");
var { VerifyToken, VerifyAdmin } = require("./middleware/verify");
var env = require("./env");
const logger = require("./logger");
dotenv.config();

const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

let uri = process.env.DB_URL;
const mongo_user = process.env.MONGODB_USER;
const mongo_pass = process.env.MONGODB_PASS;
const secret = process.env.AUTH_SECRET;

if (mongo_user && mongo_pass && uri.indexOf()) {
    const splitted = uri.split("//");
    const server = splitted[1].split("/")[0];
    if (server.indexOf("@") < 0) uri = splitted[0] + "//" + mongo_user + ":" + mongo_pass + "@" + splitted[1];
}

logger.initGlobally();

mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true, serverSelectionTimeoutMS: 30000 });
mongoose.connection.on("disconnected", (error) => {
    console.log("disconnect");
    setTimeout(() => {
        //console.log('Reconnect2');
        mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
        db = mongoose.connection;
    }, 5000);
});

var db = mongoose.connection;
autoIncrement.initialize(db);
db.on("error", function (err) {
    console.log("Error happened");
    console.error("MongoDB event error: " + err);
});
db.once("open", function (callback) {
    console.log("Connection Succeeded");
});

var router = require("./router");
var app = express();
const helmet = require("helmet");
app.use(helmet());
if (!process.env.FRONTEND_URL) {
    console.error("Add FRONTEND_URL");
}

//app.set('port', process.env.PORT || 4001);
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
var corsOptions = {
    origin: process.env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ limit: "20mb", extended: true }));

app.use(express.static(path.join(__dirname, "public")));

const configurations = require("./routes/configurations");

app.use(function (req, res, next) {
    res.set("Cache-Control", "no-store");
    next();
});
app.use("/configurations", VerifyToken, VerifyAdmin, configurations);
app.use("/", router);

module.exports = app;

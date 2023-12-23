const mongoose = require("mongoose");
const autoIncrement = require("mongoose-auto-increment");

const User = new mongoose.Schema({
    FirstName: String,
    LastName: String,
    RegisteredDate: String,
    LastSuccessfulLogin: String,
    RegisteredUserEmail: String,
    Password: String,
    role: String,
    AccessableCollections: { type: Array },
    UserId: { type: Number },
    PasswordHashed: { type: String, default: "" },
    Location: String,
    Upwork_Id: String,
    Upwork_Profile_Id: String,
});

User.methods.getFullName = function () {
    return this.FirstName + " " + this.LastName;
};
User.pre("save", function (next) {
    var t = this;
    this.constructor
        .findOne({})
        .sort({ UserId: -1 })
        .then((data) => {
            const t2 = Object.assign({}, data);
            this["UserId"] = t2["_doc"].UserId + 1;
            next();
        });
});
module.exports = User;

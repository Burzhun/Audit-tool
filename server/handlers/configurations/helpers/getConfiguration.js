const httpErrors = require("http-errors");
const { Configuration, SchemaOverview } = require("../../../admin_models");
const jwt = require("jsonwebtoken");
const getCollectionConfiguration = require("./getCollectionConfiguration");

module.exports = async (req, res, next) => {
    const { name: collectionName } = req.params;
    const { user_type } = req.body;
    var token = req.headers["x-access-token"];
    const secret = process.env.AUTH_SECRET;
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
            console.log(err);
            return res.send({ auth: false, message: "Failed to authenticate token." });
        }

        //req.userId = decoded.user_id;

        const configuration = req.body.newCollection ? null : await getCollectionConfiguration(collectionName, [], user_type.toLowerCase());

        const scheme = await SchemaOverview.findOne({
            collectionName: collectionName
        });

        if (!configuration) {
            if (req.body.newCollection) {
                const conf = new Configuration({
                    CollectionRelevantFor: collectionName,
                    DefaultFieldsToDisplayInAuditSession: [],
                    DefaultNestedFieldsSearch: [],
                    DefaultSearchFieldName: "",
                    SearchFieldNames: [],
                    DefaultFieldsToDisplayInSearchResultView: [],
                    UnEditableFields: [],
                    Visibility: { public: false },
                    UnDisplayableFields: [],
                    Validators: [],
                    FieldsToDisplayOnMiddleScreen: [],
                    ConfidenceScores: [],
                    update_logics: [],
                    DefaultSortings: [],
                    user_type,
                    TableSettings: [],
                    CopyToText: {},
                    AuditDropdownVisible: true,
                    ConfidenceScoreRequired: false,
                    UnDisplayableFields: []
                });
                conf.save((err) => {
                    if (err) {
                        res.send({
                            success: false,
                            error: err
                        });
                    } else {
                        res.send({
                            data: conf,
                            validators: conf.Validators,
                            newCollection: true,
                            scheme: null,
                            role: decoded.role,
                            username: decoded.first_name
                        });
                    }
                    return;
                });
            } else throw new httpErrors.NotFound("Configuration for collection not found");
        }

        res.send({
            data: configuration,
            validators: configuration.Validators,
            scheme: scheme,
            role: decoded.role,
            username: decoded.first_name
        });
    });
};

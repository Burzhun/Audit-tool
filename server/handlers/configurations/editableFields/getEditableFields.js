const {
    getCurrentStateFields,
    getCollectionConfiguration,
} = require("../helpers");

module.exports = async (req, res, next) => {
    try {
        const { name: collectionName } = req.params;
        const { user_type } = req.body;

        const configuration = await getCollectionConfiguration(
            collectionName,
            ["UnEditableFields"],
            user_type
        );

        const currentStateFields = await getCurrentStateFields(collectionName);
        const uneditable = configuration.UnEditableFields || [];
        const editable = currentStateFields.filter(
            (item) => !uneditable.includes(item)
        );

        res.send({
            editable,
            uneditable,
        });
    } catch (e) {
        next(e);
    }
};

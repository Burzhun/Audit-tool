const utils = require("./utils");

function prepareCopyData(collectionName, recordID, maxRecordId, oldDoc, UserName) {
    const newRecord = utils.getProductSchema(collectionName);
    let audit_date = new Date();
    audit_date = audit_date.toISOString();
    let AuditState = Object.assign({}, oldDoc.AuditState);
    let session = {
        AuditNumber: 0,
        RegisteredUserEmail: UserName,
        AuditeDate: audit_date,
        ConfidenceScore: null
    };
    if (oldDoc.AuditSessions.length > 0) {
        session = oldDoc.AuditSessions[oldDoc.AuditSessions.length - 1];
    }
    AuditState.AuditNumber = session.AuditNumber + 1;
    AuditState.ConfidenceScore = session.ConfidenceScore;
    AuditState.LastEditedAt = audit_date;
    AuditState.LastEditedBy = UserName;
    if (oldDoc.AuditState) {
        AuditState.NoteOnConfidenceScore = oldDoc.AuditState.NoteOnConfidenceScore;
    } else {
        AuditState.NoteOnConfidenceScore = "";
    }
    let AuditSessions = oldDoc.AuditSessions;
    AuditSessions.push({
        AuditDate: audit_date,
        AuditType: "RecordCopy",
        RegisteredUserEmail: UserName,
        ConfidenceScore: session.ConfidenceScore,
        AuditNumber: session.AuditNumber + 1,
        AuditValueArray: [
            { AuditFieldName: "IsDuplicate", OldValue: null, NewValue: true, Valid: true, AuditedComment: "RecordCopy" },
            { AuditFieldName: "CopyOfRecordId", OldValue: null, NewValue: recordID, Valid: true, AuditedComment: "RecordCopy" }
        ]
    });
    let newDoc = new newRecord({
        RecordId: maxRecordId,
        CurrentState: oldDoc.CurrentState,
        AuditSessions: AuditSessions,
        AuditState: AuditState
    });
    newDoc.CurrentState["AuditNumber"] = session.AuditNumber + 1;
    newDoc.CurrentState["IsDuplicate"] = true;
    newDoc.CurrentState["CopyOfRecordId"] = recordID;
    return newDoc;
}

module.exports = function (req, res) {
    const collectionName = req.body.collectionName;
    const UserName = req.body.UserName;
    const recordID = parseInt(req.body.recordID);
    const productSchema = utils.getProductSchema(collectionName);

    productSchema
        .find({}, { RecordId: 1 })
        .sort({ RecordId: -1 })
        .limit(1)
        .then((maxRecordId) => {
            productSchema
                .findOne({ RecordId: recordID })
                .then((result) => {
                    var newDoc = prepareCopyData(collectionName, recordID, maxRecordId[0]["RecordId"] + 1, result, UserName);

                    newDoc.save(function (err, r) {
                        if (err) {
                            res.send({
                                success: false
                            });
                        } else {
                            res.send({
                                success: true,
                                recordID: maxRecordId[0]["RecordId"] + 1
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error(error);
                    res.send({
                        success: false
                    });
                });
        });
};

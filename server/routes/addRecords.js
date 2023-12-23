const utils = require('./utils');

module.exports = async function (req, res) {
  const {fields, collectionName, UserName} = req.body;
  const productSchema = utils.getProductSchema(collectionName);
  let newRecord = utils.getProductSchema(collectionName);
  const maxRecord = await productSchema.find({}, {'RecordId': 1}).sort({'RecordId': -1}).limit(1);
  const maxRecordId = maxRecord[0]['RecordId'] + 1;
  newRecord.RecordId = maxRecordId;
  let CurrentState = fields.reduce((o, key) => ({ ...o, [key]: null}), {});
  CurrentState.AuditNumber = 0;
  CurrentState.FirmIdNumber = null;
  const AuditSessions = [];
  let auditDate = new Date();
  auditDate = auditDate.toISOString();
  const AuditState = {
      'AuditNumber' : 0,
      'LastEditedAt' : auditDate,
      'LastEditedBy' : UserName,
  };
  try {
    const newDocument = new newRecord({
      RecordId: maxRecordId,
      CurrentState: CurrentState,
      AuditSessions: AuditSessions,
      AuditState: AuditState
    })
    newDocument.save();
    res.send({success: true, recordID: maxRecordId})
  } catch (e) {
    console.error(e);
    res.send({success: false, error: e})
  }

};

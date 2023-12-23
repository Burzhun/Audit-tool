const mongoose = require('mongoose');

const CurrentState = {
	NameOfProduct: { type: String },
	ResearcherName: { type: String },
	CollectedDate: { type: String },
	Url: { type: String },
	AuditNumber: { type: Number },
	ImageLinks: {type: mongoose.Schema.Types.Mixed}
};

const AuditSessions = {
	AuditNumber: { type: Number },
	RegisteredUserEmail: { type: String },
	AuditeDate: { type: String },
	ConfidenceScore: { type: Number },
	AuditValueArray: {
		type: []
	}
};

const AuditState = {
	AuditNumber : { type: Number },
	ConfidenceScore : { type: Number },
	LastEditedAt : { type: String },
	LastEditedBy : { type: String },
	NoteOnConfidenceScore: { type: String },
}

const Product = new mongoose.Schema({
	RecordId: { type: Number },
	CurrentState: { type: CurrentState },
	AuditSessions: { type: [AuditSessions] },
	AuditState: { type: AuditState}
}, { strict: false, versionKey: false, minimize: false});


module.exports = Product;

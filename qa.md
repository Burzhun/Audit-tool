### Before you mark any task as completed:

1. Everything that is described in the task is done, it works as described.
2. On the dashboard works:

	2.1 selecting a dataset
	
	2.2 Search
	
	2.3 Selecting a search field
	
	2.4 Adding a field to the results table
	
		2.4.1 the CopyOfRecordId and IsDuplicate fields are displayed Correctly
	
	2.5 Deleting a field, filtering, sorting
	
	2.6 Transition to the audit screen by clicking on a table row.
	
3. On the audit screen:

	3.1 the Data is loaded, with relevant Record ID and Firm ID 
	
	3.2 adding a field works
	
	3.3 editing function works
	
	3.4 saving function works
	
		3.4.1 adding a comment to a data field works
		3.4.2 after saving the field in CurrentState changed, the data type is correct
		3.4.3 changed the correct AuditState and AuditSessions, in the latest AuditValueArray contains the necessary data 
		3.4.4 selecting ConfidentScore and adding Note on Confident Score works
	
	3.5 copy function works
	
	3.6 the Images may not be loaded for all records, but if it was loaded before, it must be loaded
	
4. When building and after testing there are no errors in the front end and backend console and in the browser console
5. Unit tests are run and passed (npm run test)

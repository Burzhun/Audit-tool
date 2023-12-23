# test_global_updates
## 
### test_global_updates

    The user goes to search form.
    The user clicks on the btn and inits global update for
    the collection.

    In the collection copy initiate native js pipeline runs.
    Check documents after update in 2 collections.
    

**Markers:**
- global_updates

### test_global_script

    Run global updates by script
    :param browser:
    :return:
    

**Markers:**
- global_script
### test_compare_results

    Compare results of previous 2 tests
    :return:
    

**Markers:**
- compare_results
### test_global_upd_high_and_low_field

    The user creates collection with global updates.
    The user goes to the document and initiates pipeline by clicking on
    the button.
    The user manually changes globally updated fields.
    for high level field: any_qa_issue.
    And for low-level: amount_margin_approved.
    The user sets new data and saves document.
    The user clicks on update button and checks that exception fields are not updated.
    Make check for different field types.
    The user returns on search form and checks that global update for all the collection
    does not overwrites exception fields
    

**Markers:**
- parametrize (qa_field, low_level_field[({'name': 'qa_field', 'type': 'bool', 'NewValue': True, 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'bool', 'NewValue': True, 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'bool', 'NewValue': False, 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'bool', 'NewValue': False, 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'numeric', 'NewValue': 2, 'OldValue': 10, 'Valid': False}, {'name': 'low_level_field', 'type': 'numeric', 'NewValue': 2, 'OldValue': 10, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'text', 'NewValue': 'my text', 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'text', 'NewValue': 'my text', 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False})])
- manual_overwrite
- skip
### test_global_upd_high_and_low_field

    The user creates collection with global updates.
    The user goes to the document and initiates pipeline by clicking on
    the button.
    The user manually changes globally updated fields.
    for high level field: any_qa_issue.
    And for low-level: amount_margin_approved.
    The user sets new data and saves document.
    The user clicks on update button and checks that exception fields are not updated.
    Make check for different field types.
    The user returns on search form and checks that global update for all the collection
    does not overwrites exception fields
    

**Markers:**

    parametrize (qa_field, low_level_field[({'name': 'qa_field', 
    'type': 'bool', 'NewValue': True, 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'bool', 'NewValue': True, 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'bool', 'NewValue': False, 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'bool', 'NewValue': False, 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'numeric', 'NewValue': 2, 'OldValue': 10, 'Valid': False}, {'name': 'low_level_field', 'type': 'numeric', 'NewValue': 2, 'OldValue': 10, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'text', 'NewValue': 'my text', 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'text', 'NewValue': 'my text', 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False})])
    manual_overwrite
    skip
    
### test_global_upd_high_and_low_field

    The user creates collection with global updates.
    The user goes to the document and initiates pipeline by clicking on
    the button.
    The user manually changes globally updated fields.
    for high level field: any_qa_issue.
    And for low-level: amount_margin_approved.
    The user sets new data and saves document.
    The user clicks on update button and checks that exception fields are not updated.
    Make check for different field types.
    The user returns on search form and checks that global update for all the collection
    does not overwrites exception fields
    

**Markers:**
- parametrize (qa_field, low_level_field[({'name': 'qa_field', 'type': 'bool', 'NewValue': True, 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'bool', 'NewValue': True, 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'bool', 'NewValue': False, 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'bool', 'NewValue': False, 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'numeric', 'NewValue': 2, 'OldValue': 10, 'Valid': False}, {'name': 'low_level_field', 'type': 'numeric', 'NewValue': 2, 'OldValue': 10, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'text', 'NewValue': 'my text', 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'text', 'NewValue': 'my text', 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False})])
- manual_overwrite
- skip
### test_global_upd_high_and_low_field

    The user creates collection with global updates.
    The user goes to the document and initiates pipeline by clicking on
    the button.
    The user manually changes globally updated fields.
    for high level field: any_qa_issue.
    And for low-level: amount_margin_approved.
    The user sets new data and saves document.
    The user clicks on update button and checks that exception fields are not updated.
    Make check for different field types.
    The user returns on search form and checks that global update for all the collection
    does not overwrites exception fields
    

**Markers:**
- parametrize (qa_field, low_level_field[({'name': 'qa_field', 'type': 'bool', 'NewValue': True, 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'bool', 'NewValue': True, 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'bool', 'NewValue': False, 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'bool', 'NewValue': False, 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'numeric', 'NewValue': 2, 'OldValue': 10, 'Valid': False}, {'name': 'low_level_field', 'type': 'numeric', 'NewValue': 2, 'OldValue': 10, 'parent': 'amounts_and_rates', 'Valid': False}), ({'name': 'qa_field', 'type': 'text', 'NewValue': 'my text', 'OldValue': None, 'Valid': False}, {'name': 'low_level_field', 'type': 'text', 'NewValue': 'my text', 'OldValue': None, 'parent': 'amounts_and_rates', 'Valid': False})])
- manual_overwrite
- skip
### test_chained_updates

    Check results for chained update.
    Compare results by script and by app.
    Chained pipeline should be applied according to the
    results of previous pipeline.
    :param browser:
    :param gen_data_per_function:
    :return:
    

**Markers:**
- check_chained_updates
- skip
### test_one_doc_update

    Check single document global update
    for pipeline by script and for pipeline in app.
    Check that results are the same.
    :param browser:
    :param gen_data_per_function:
    :return:
    

**Markers:**
- check_single_upd
- skip
### test_12234_check_updated_valid_fields

    The user goes to document that is already audited
    and audited fields are set as valid true.
    The user runs global
    update and checks that audited fields
    are not changed.
    

**Markers:**
- check_exceptions_for_valid
- skip
### test_12191_always_running_pipeline
The user adds aggregation function
    that should be run on single document.
    But specifies field allDocumentsShouldBeUpdated
    to true:
    {
            "matching_fields" : [
                "organization_id"
            ],
            "updatable_fields" : [
                "any_qa_issues",
                "amounts_and_rates.amount_margin_approved",
                "matched_data3",
                "update_doc3",
                "test_field"
            ],
            "aggregation_pipeline" : "[
    {'match': {"RecordId": 1200}}
]",
            "allDocumentsShouldBeUpdated": true
        }
    The user runs global update and checks that document that does not match pipeline was updated too.
    

**Markers:**
- check_always_running_pipeline
- skip
### test_count_docs_without_interbank_rate

    Test is set to count documents without interbank rate for initial collection.
    There should be 5 docs
    :param gen_data_per_function:
    :return:
    

**Markers:**
- count_docs_without_interbank_rate
- skip
### test_12092_failing_pipeline

    The user tries to set up pipelina that is failing.
    Check that documents are not being updated
    if pipeline has error and notification is displayed to the user
    :param browser:
    :param gen_data_per_function:
    :return:
    

**Markers:**
- failing_pipeline
- skip
### test_one_check

**Markers:**
- check_g_upd
- skip

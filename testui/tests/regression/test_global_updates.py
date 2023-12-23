import json
import time
from datetime import datetime

import pytest
from faker import Faker

from conftest import doc_it
from dbutil.db_utils import find_docs_in_collection, update_mongo
from pages.validation.validation_page_actions import ValidationPage
from params import db_params, params
from params.texts import PIPELINE_ERROR, GLOBAL_UPDATE
from utils.app_actions import login_and_go_to_url
from utils.app_utils import audit_field, compare_elk_logs
from utils.common_utils import convert_bool_to_str, api_call


@pytest.mark.imti
@pytest.mark.usefixtures("remove_files")
class TestGlobalUpdateCollection:
    @doc_it()
    @pytest.mark.check_single_upd
    @pytest.mark.parametrize("collection_name, record_id", [(db_params.GLOB_TEST_WITH_EXC_FOR_APP, 9167)])
    def test_one_doc_update(self, browser, collection_name, gen_data, record_id):
        """
        Check single document global update
        for pipeline by script and for pipeline in app.
        Check that results are the same.
        """
        errors = []
        login_and_go_to_url(browser, collection_name, record_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        notification = 'Warning. This will trigger Global Updates on the entire dataset. Updates may take some time (up to minutes) to run.'
        validation.click_on_global_updates_button()
        alert_text = validation.get_alert_text()
        if notification not in alert_text:
            errors.append(f"Wrong notification is displayed when clicking on update button")
        browser.get_log("performance")
        validation.confirm_alert()
        validation.check_global_updates_validation()
        api_data = browser.get_log("performance")
        req_data = api_call(api_data, False)
        req = [json.loads(x["request"]["postData"]) for x in req_data["api_reqs"]]
        if req:
            if req[0][db_params.COLLECTION_NAME] != collection_name or int(req[0]["recordId"]) != record_id:
                errors.append("wrong params sent to api")
        else:
            errors.append("expected api call to be sent")
        assert errors == []

    @doc_it()
    @pytest.mark.count_docs_without_interbank_rate
    def test_count_docs_without_interbank_rate(self):
        """
        Test is set to count documents without interbank rate for initial collection.
        There should be 5 docs
        :return:
        """
        errors = []
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        without_interbank_rate = find_docs_in_collection(collection_name,
                                                         {f"{db_params.CURRENT_STATE}.{db_params.AMOUNTS_AND_RATES}": {
                                                             "$elemMatch": {"interbank_rate": float('NaN')}}}, False)
        if len(without_interbank_rate) != 5:
            errors.append(
                f"expected number of docs without interbank_rate should be 5, got {len(without_interbank_rate)}")
        assert errors == []

    @doc_it()
    @pytest.mark.skip
    @pytest.mark.failing_pipeline
    @pytest.mark.config_update
    @pytest.mark.parametrize("collection_name, record_id", [(db_params.GLOB_TEST_WITH_EXC_FOR_APP, 445)])
    def test_12092_failing_pipeline(self, browser, collection_name, record_id, gen_data):
        """
        The user tries to set up pipeline that is failing.
        Check that documents are not being updated
        if pipeline has error and notification is displayed to the user
        """
        errors = []
        pipeline_desc = Faker().sentence()
        pipeline = {
            "allDocumentsShouldBeUpdated": True,
            "matching_fields": [
                db_params.RECORD_ID
            ],
            "updatable_fields": [
                "name_of_researcher"
            ],
            "update_function": """{\n var update_doc={}; \n update_doc['CurrentState.name_of_researcher']='text'++; \nreturn {$set: update_doc};}""",
            "aggregation_pipeline": "[\n    {'$match': {'RecordId': 445}}\n]",
            "description": pipeline_desc
        }
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {"global_automatic_updates": [pipeline]}})
        login_and_go_to_url(browser, collection_name, record_id)
        dt = datetime.strftime(datetime.utcnow(), "%Y-%m-%dT%H:%M:%S")
        validation = ValidationPage(browser)
        validation.global_updates(False)
        # confirm alert with warning that alert takes much time
        alert_text = validation.get_alert_text()
        if PIPELINE_ERROR not in alert_text:
            errors.append(f"expected {PIPELINE_ERROR} to be in alert, got {alert_text}")
        errors += compare_elk_logs(dt, global_pipeline_description=pipeline_desc, update_success=False,
                                   logtype=GLOBAL_UPDATE)
        assert errors == []

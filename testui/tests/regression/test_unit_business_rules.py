import pytest

from conftest import doc_it
from dbutil.db_utils import update_mongo, find_docs_in_collection
from pages.validation.validation_page_actions import ValidationPage
from params import db_params, params
from utils.app_actions import login_and_go_to_url
from utils.app_utils import audit_field


@pytest.mark.usefixtures("remove_files")
@pytest.mark.fx_fee
class TestUnitBusinessRules:
    @doc_it()
    @pytest.mark.uneditable_fields
    @pytest.mark.parametrize("collection_name, record_id", [(db_params.TEST_FX_FEES_0_2, 1)])
    def test_14790_uneditable_fields(self, browser, gen_data, collection_name, record_id):
        """
        The user sets up uneditable fields in the collection
        and checks if the fields are really uneditable
        for both high level fields and low
        level fields
        :return:
        """
        errors = []
        login_and_go_to_url(browser, db_params.TEST_FX_FEES_0_2, record_id)
        page = ValidationPage(browser)
        page.remove_fixed_elements()
        row_ids = page.get_all_ids_from_field_with_sub_ranges(db_params.FX_FEE_TABLE)
        for field in [{db_params.NAME: "Collection Id", params.ROW_ID: None},
                      {db_params.NAME: "Range Id", params.ROW_ID: row_ids[0]}]:
            if field[params.ROW_ID]:
                page.add_sub_table_field(db_params.FX_FEE_TABLE, field[db_params.NAME])
                page.select_sub_table_row_by_id(field[params.ROW_ID])
                f_type = "high"
            else:
                f_type = "low"

            if not page.check_uneditable_field(field[db_params.NAME], field[params.ROW_ID]):
                errors.append(f"expected {f_type} field to be uneditable")
        assert errors == []

    @doc_it()
    @pytest.mark.exclusive_constraint
    @pytest.mark.config_update
    @pytest.mark.parametrize("collection_name, record_id", [(db_params.TEST_FX_FEES_0_2, 1)])
    def test_14384_exclusive_constraint(self, browser, collection_name, record_id, gen_data):
        """
        The user sets up exclusive values
        and checks that after selection
        that after selection exclusive value no possibility to
        select anything in the dropdown list
        :param browser:
        :return:
        """
        errors = []
        field_val = "All countries"
        field_name = "fees.Countries to"
        config = find_docs_in_collection(db_params.CONFIGURATION,
                                         {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        primary_field_validator = [x for x in config[db_params.VALIDATORS] if x[db_params.NAME] == field_name]
        # pull old constraint and push empty constraint for numeric type
        const_dict = primary_field_validator[0][db_params.CONSTRAINTS]
        const_dict[db_params.EXCLUSIVE_VALUE] = ["All countries"]
        for req in [{"$pull": {db_params.VALIDATORS: {db_params.NAME: field_name}}},
                    {"$push": {db_params.VALIDATORS: {
                        "type": "enumerate_array",
                        "constraints": {
                            "Exclusive value": [
                                "All countries",
                                "Eurozone"
                            ],
                            "multiple": True,
                            "nullable": False,
                            "values": [
                                "Eurozone",
                                "US",
                                "GB",
                                "CA",
                                "AU",
                                "All countries",
                            ]
                        },
                        "name": field_name}
                    }}]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         req)
        login_and_go_to_url(browser, db_params.TEST_FX_FEES_0_2, record_id)
        page = ValidationPage(browser)
        page.remove_fixed_elements()
        field = {
            db_params.NAME: "fees.Countries to",
            db_params.NEW_VALUE: ["GB"],
            db_params.TYPE: db_params.ENUM,
            db_params.VALID: False
        }
        errors += audit_field(browser, field)
        vals = page.get_react_dropdown_values()
        if 'No options' in vals:
            errors.append("expected no options not to be in the list")
        field[db_params.NEW_VALUE] = [field_val]
        errors += audit_field(browser, field)
        vals = page.get_react_dropdown_values()
        if 'No options' not in vals:
            errors.append("expected no options not to be in the list")
        if page.get_hof_upd_value(field[db_params.NAME], True) != field_val:
            errors.append(f"expected value for the field to be {field_val}")
        assert errors == []

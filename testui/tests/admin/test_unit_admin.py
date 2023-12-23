import random

import pytest
from faker import Faker

from conftest import doc_it
from dbutil.db_utils import find_docs_in_collection, update_mongo
from pages.admin.admin_page import AdminPage
from params import db_params, texts
from utils.app_actions import login_and_go_to_url


@pytest.mark.usefixtures("remove_files")
class TestUnitAdmin:
    @doc_it()
    @pytest.mark.gte_zero_constraint
    def test_14385_set_constraint_gte_zero(self, browser):
        """
        Admin goes to admin panel and
        tries to set numeric field constraint
        to zero
        :param browser:
        :return:
        """
        errors = []
        field_name = f"{db_params.AMOUNTS_AND_RATES}.{db_params.FX_RATE}"
        collection_name = db_params.GLOB_TEST_WITH_EXC_FOR_APP
        config = find_docs_in_collection(db_params.CONFIGURATION,
                                         {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        fx_rate_validator = [x for x in config[db_params.VALIDATORS] if x[db_params.NAME] == field_name]
        # pull old constraint and push empty constraint for numeric type
        for req in [{"$pull": {db_params.VALIDATORS: {db_params.NAME: field_name}}},
                    {"$push": {db_params.VALIDATORS: {db_params.NAME: field_name, db_params.TYPE: db_params.NUMERIC,
                                                      db_params.CONSTRAINTS: {}}}}]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         req)
        login_and_go_to_url(browser, collection_name, is_admin=True)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(texts.FIELD_VALIDATION)
        admin_page.select_validator_by_name(f"{db_params.AMOUNTS_AND_RATES}.{db_params.FX_RATE}")
        to_add = True
        for item in [db_params.GTE, db_params.LTE, db_params.GT, db_params.LT]:
            admin_page.set_constraint(item, 0, to_add=to_add)
            to_add = False
            admin_page.save_validator()
            admin_page.confirm_alert()
            constraints = admin_page.get_field_constraints()
            if constraints[0][db_params.NAME] != item and constraints[0][db_params.NEW_VALUE] != 0:
                errors.append(f"expected constraint {item} value to be 0, got {constraints[0][db_params.NEW_VALUE]}")
        # return back primary constraint
        for req in [{"$pull": {db_params.VALIDATORS: {db_params.NAME: field_name}}}, {"$push": fx_rate_validator[0]}]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         req)
        assert errors == []

    @doc_it()
    @pytest.mark.set_constraint_function
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name", [db_params.GLOB_TEST_WITH_EXC_FOR_APP])
    def test_14386_set_constraint_function(self, browser, collection_name, gen_data):
        """
        The user sets function constraint to the field.
        The user checks that constraint function is
        set in the db as string not as array
        :param browser:
        :return:
        """
        errors = []
        login_and_go_to_url(browser, collection_name, is_admin=True)
        field_name = f"{db_params.AMOUNTS_AND_RATES}.{db_params.FX_RATE}"
        # pull old constraint and push empty constraint for numeric type
        for req in [{"$pull": {db_params.VALIDATORS: {db_params.NAME: field_name}}},
                    {"$push": {db_params.VALIDATORS: {db_params.NAME: field_name, db_params.TYPE: db_params.NUMERIC,
                                                      db_params.CONSTRAINTS: {}}}}]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         req)
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(texts.FIELD_VALIDATION)
        admin_page.select_validator_by_name(f"{db_params.AMOUNTS_AND_RATES}.{db_params.FX_RATE}")
        function = """{
                    var multiple_countries = this['Countries to'] && (this['Countries to'].length>1 || this['Countries to'][0].includes(' countries'));
                    if (multiple_countries  && this['Currency to'] !== null)
                    {
                        return '"Currency to" must be null if "Countries to" indicates more than one country or currency-zone';
                    }
                    if (this['Countries to'] && !multiple_countries && this['Currency to'] === null)
                    {
                        return '"Currency to" must NOT be null if "Countries to" indicates just one country or currency-zone';
                    }
                }"""
        admin_page.set_constraint(db_params.CUSTOM_FUNCTION, function, to_add=True, constraint_type="textarea")
        admin_page.save_validator()
        admin_page.confirm_alert()
        upd_config = find_docs_in_collection(db_params.CONFIGURATION,
                                             {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        if [x[db_params.CONSTRAINTS][db_params.CUSTOM_FUNCTION] for x in upd_config[db_params.VALIDATORS] if
            x[db_params.NAME] == field_name][0] != function:
            errors.append("expected function to be the same as preset")
        assert errors == []

    @doc_it()
    @pytest.mark.set_exclusive_values
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name", [db_params.TEST_FX_FEES_0_2])
    def test_14931_set_exclusive_values(self, browser, collection_name, gen_data):
        """
        The user sets multiple values in
        exclusive values and this should be
        saved as array
        :param browser:
        :return:
        """
        errors = []
        login_and_go_to_url(browser, collection_name, is_admin=True)
        field_name = "fees.Countries to"
        # pull old constraint and push empty constraint for numeric type
        for req in [{"$pull": {db_params.VALIDATORS: {db_params.NAME: field_name}}},
                    {"$push": {db_params.VALIDATORS: {db_params.NAME: field_name, db_params.TYPE: db_params.ENUM_ARRAY,
                                                      db_params.CONSTRAINTS: {}}}}]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         req)
        values = 'AU,US,GB,CA'
        exclusive_values = 'US,GB'
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(texts.FIELD_VALIDATION)
        admin_page.select_validator_by_name(field_name)
        # check constraint list (Exclusive values should not be there)
        admin_page.add_constraint_click()
        constraint_list = admin_page.get_constraint_list(True)
        if db_params.EXCLUSIVE_VALUE in constraint_list:
            errors.append(f"{db_params.EXCLUSIVE_VALUE} constraint needs to be set only after {db_params.VALUES} constraint")
        admin_page.remove_constraint(0)
        # try to save without constraints, check notification message
        admin_page.save_validator()
        if admin_page.get_alert_text() != texts.VALUES_CONSTRAINT_MUST_BE_SET:
            errors.append(f"alert text differs from {texts.VALUES_CONSTRAINT_MUST_BE_SET}")
        admin_page.confirm_alert()
        # set values and set Exclusive values
        admin_page.set_constraint(db_params.VALUES, values, to_add=True)
        values_on_page = admin_page.get_values_from_value_constraint()
        if [x for x in exclusive_values.split(',') if x not in values_on_page]:
            errors.append("all the exclusive values must be among values")
        else:
            admin_page.set_exclusive_value_constraint(exclusive_values.split(','))

        admin_page.save_validator()
        if admin_page.get_alert_text() != texts.SUCCESSFULLY_UPDATED:
            errors.append(f"alert text differs from {texts.SUCCESSFULLY_UPDATED}")
        admin_page.confirm_alert()
        upd_config = find_docs_in_collection(db_params.CONFIGURATION,
                                             {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        upd_validator = \
            [x for x in upd_config[db_params.VALIDATORS] if x[db_params.NAME] == field_name][0][db_params.CONSTRAINTS][
                db_params.EXCLUSIVE_VALUE]
        if sorted(upd_validator) != sorted(exclusive_values.split(",")):
            errors.append(f"expected constraint to be {sorted(exclusive_values.split(','))}, got {sorted(upd_validator)}")
        assert errors == []

    @doc_it()
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    @pytest.mark.validators_arrays_texts
    @pytest.mark.parametrize("collection_name", [db_params.TEST_FX_FEES_0_2])
    def test_14954_validators_arrays_texts(self, browser, collection_name, gen_data):
        """
        The user sets up validator values as
        array of strings.
        Check that everything is
        saved correctly in the DB.
        :param browser:
        :return:
        """
        errors = []
        login_and_go_to_url(browser, collection_name, is_admin=True)
        field_name = "fees.Countries to"
        # pull old constraint and push empty constraint for numeric type
        for req in [{"$pull": {db_params.VALIDATORS: {db_params.NAME: field_name}}},
                    {"$push": {db_params.VALIDATORS: {db_params.NAME: field_name, db_params.TYPE: db_params.TEXT_ARRAY,
                                                      db_params.CONSTRAINTS: {}}}}]:
            update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                         req)
        string_vals = []
        for i in range(0, 4):
            string_vals.append(Faker().word())
        admin_page = AdminPage(browser)
        admin_page.select_collection(collection_name)
        admin_page.select_link_by_text(texts.FIELD_VALIDATION)
        admin_page.select_validator_by_name(field_name)

        admin_page.set_constraint(db_params.VALUES, ','.join(string_vals), to_add=True)
        admin_page.save_validator()
        admin_page.confirm_alert()
        upd_config = find_docs_in_collection(db_params.CONFIGURATION,
                                             {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        upd_validator = \
            [x for x in upd_config[db_params.VALIDATORS] if x[db_params.NAME] == field_name][0][db_params.CONSTRAINTS][
                db_params.VALUES]
        if sorted(upd_validator.split(',')) != sorted(string_vals):
            errors.append(f"expected constraint to be {sorted(string_vals)}, got {sorted(upd_validator.split(','))}")
        int_vals = []
        for i in range(0, 4):
            int_vals.append(round(random.uniform(1, 100), 2))
        admin_page.set_field_data_type(db_params.NUMERIC_ARRAY)
        admin_page.set_constraint(db_params.VALUES, ','.join([str(x) for x in int_vals]))
        admin_page.save_validator()
        admin_page.confirm_alert()
        upd_config = find_docs_in_collection(db_params.CONFIGURATION,
                                             {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        upd_validator = \
            [x for x in upd_config[db_params.VALIDATORS] if x[db_params.NAME] == field_name][0][db_params.CONSTRAINTS][
                db_params.VALUES]
        if sorted([float(x) for x in upd_validator.split(',')]) != sorted(int_vals):
            errors.append(f"expected constraint to be {sorted(int_vals)}, got {[float(x) for x in upd_validator.split(',')]}")
        assert errors == []

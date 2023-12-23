import json
import os
import time
from datetime import datetime

import pytest

from dbutil.db_utils import find_docs_in_collection, update_mongo
from pages.validation.validation_page_actions import ValidationPage
from params import params
from params import texts
from params.db_params import NAME, CURRENT_STATE, AREA_KM2, TESTING_HALINA, TYPE, NEW_VALUE, NUMERIC, LEADER, TEXT, \
    DATE_TYPE, RECORD_ID, CONFIGURATION, COLLECTION_RELEVANT_FOR, AUDIT_STATE, AUDIT_NUMBER, LAST_EDITED_AT, \
    LAST_EDITED_BY, CONFIDENCE_SCORE, NOTE_ON_CONFIDENCE_SCORE, AUDIT_SESSIONS, AUDIT_VALUE_ARRAY, AUDIT_FIELD_NAME, \
    COMMERCIAL_MARGINS, OLD_VALUE, AUDITED_COMMENT, CONSUMER_MARGINS, VALID
from utils.app_actions import login_and_search_record_by_record_id, login_and_go_to_url
from utils.app_utils import audit_field, check_is_pass, param_to_datetime
from utils.common_utils import get_name_from_array, margins_calc, full_cost_calc


@pytest.mark.usefixtures("remove_files")
class TestIntegration:
    @pytest.mark.complex
    @pytest.mark.skip
    def test_complex(self, browser):
        """User audits 2 high level fields
        User validates 1 row, adds 1 row and removes 2 rows from low level fields.
        The user sets 1-st row with invalid amount and timestamp, 2-nd row with invalid amount for ConsumerMargins.
        For added row user sets amount, timestamp, fx_rate, ib_rate and fee.
        The user sets invalid field leader as Angela Merkel.
        The user sets a new row with all nulls for ConsumerMargins.
        After receiving error, user fixes data to valid.
        The user sets invalid info and then changes it to valid"""
        # todo: add to jest
        errors = []
        collection_name = TESTING_HALINA
        doc_id = 4
        fields = [{NAME: AREA_KM2, NEW_VALUE: 50000, params.NEW_VALUE_PASS: True,
                   TYPE: NUMERIC, VALID: False},
                  {NAME: LEADER, NEW_VALUE: "Angela Merkel",
                   params.NEW_VALUE_PASS: False,
                   "valid_value": "Leader", TYPE: TEXT, VALID: False},
                  {NAME: "amount", NEW_VALUE: 999, "parent": "ConsumerMargins", "row": 0,
                   params.NEW_VALUE_PASS: False, "valid_value": 1000.01, TYPE: NUMERIC, VALID: False},
                  {NAME: "timestamp", NEW_VALUE: "2025-01-01", params.TIME: "11:22 AM",
                   params.UTC: -10, "parent": "ConsumerMargins", params.NEW_VALUE_PASS: False,
                   "valid_value": "2024-01-01", "row": 0, "type_date": True, TYPE: DATE_TYPE, VALID: False},
                  {NAME: "amount", NEW_VALUE: 799, "parent": "ConsumerMargins", "row": 1,
                   params.NEW_VALUE_PASS: False, "valid_value": 1030.01, TYPE: NUMERIC, VALID: False},
                  {NAME: "ib_rate", NEW_VALUE: 13.04, params.NEW_VALUE_PASS: True,
                   "parent": "ConsumerMargins", TYPE: NUMERIC, "row": 1, VALID: False},
                  {NAME: "fx_rate", NEW_VALUE: 10.12, "parent": "ConsumerMargins", "row": 1,
                   params.NEW_VALUE_PASS: True, TYPE: NUMERIC, VALID: False},
                  ]
        add_info = [{NAME: "amount", NEW_VALUE: 2500, params.NEW_VALUE_PASS: False,
                     "parent": "ConsumerMargins", TYPE: NUMERIC, VALID: False},
                    {NAME: "timestamp", NEW_VALUE: "2023-11-21", params.TIME: "11:22 PM",
                     params.UTC: -10, "parent": "ConsumerMargins", params.NEW_VALUE_PASS: True, "type_date": True,
                     TYPE: DATE_TYPE, VALID: False},
                    {NAME: "ib_rate", NEW_VALUE: 14, params.NEW_VALUE_PASS: True,
                     "parent": "ConsumerMargins", TYPE: NUMERIC, VALID: False},
                    {NAME: "fx_rate", NEW_VALUE: 12.3, params.NEW_VALUE_PASS: True,
                     "parent": "ConsumerMargins", TYPE: NUMERIC, VALID: False},
                    {NAME: "fee", NEW_VALUE: 7, params.NEW_VALUE_PASS: True,
                     "parent": "ConsumerMargins", TYPE: NUMERIC, VALID: False},
                    ]
        add_info_commercial = [{NAME: "amount", NEW_VALUE: 2800, params.NEW_VALUE_PASS: False,
                                "parent": "CommercialMargins", TYPE: NUMERIC, VALID: False},
                               {NAME: "timestamp", NEW_VALUE: "2023-01-21", params.TIME: "11:22 PM",
                                params.UTC: -11, "parent": "CommercialMargins", params.NEW_VALUE_PASS: True,
                                "type_date": True, TYPE: DATE_TYPE, VALID: False},
                               {NAME: "ib_rate", NEW_VALUE: 17, params.NEW_VALUE_PASS: True,
                                "parent": "CommercialMargins", TYPE: NUMERIC, VALID: False},
                               {NAME: "fx_rate", NEW_VALUE: 8.45, params.NEW_VALUE_PASS: True,
                                "parent": "CommercialMargins", TYPE: NUMERIC, VALID: False},
                               {NAME: "fee", NEW_VALUE: 8.93, params.NEW_VALUE_PASS: True,
                                "parent": "CommercialMargins", TYPE: NUMERIC, VALID: False}
                               ]
        login_and_go_to_url(browser, collection_name, doc_id)
        record_from_db = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        update_mongo(CONFIGURATION, {COLLECTION_RELEVANT_FOR: collection_name},
                     {"$push": {
                         "Validators": {NAME: "CommercialMargins.fx_margin", TYPE: NUMERIC,
                                        "constraints": {}}}})

        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        high_fields = [x for x in fields if "parent" not in x]
        low_level_fields = [x for x in fields if "parent" in x]
        for field in high_fields:
            errors += audit_field(browser, field)
        rows = set([x["row"] for x in low_level_fields])
        # get all row_ids for ConsumerMargins field
        row_ids = validation.get_all_ids_from_field_with_sub_ranges("ConsumerMargins")
        for row in rows:
            row_index = [index for (index, d) in enumerate(fields) if "row" in d and d["row"] == row]
            for ind in row_index:
                fields[ind]["row_id"] = row_ids[row]

            validation.select_sub_table_row_by_id(row_ids[row])
            inputs_to_be_set = [x for x in low_level_fields if x["row"] == row]
            for inp in inputs_to_be_set:
                inp["row_id"] = row_ids[row]
                errors += audit_field(browser, inp)
        # remove last 2 rows:
        validation.remove_sub_table_row(row_ids[-1])
        validation.remove_sub_table_row(row_ids[-2])
        # add row:
        validation.add_sub_range_row("ConsumerMargins")
        added_row_id_consumer = validation.get_selected_row_id("ConsumerMargins")
        for item in add_info:
            item["row_id"] = added_row_id_consumer
            errors += audit_field(browser, item, True)
        # add row for CommercialMargins without data:
        # validation.add_sub_range_row("CommercialMargins")
        validation.save_form_changes()
        # check notifications on form
        errors += check_is_pass(browser, fields)
        errors += check_is_pass(browser,
                                [{NAME: "fx_rate", "parent": "CommercialMargins",
                                  params.NEW_VALUE_PASS: False}])
        """User fixes errors on form"""
        fields_to_be_upd = [x for x in fields if x[params.NEW_VALUE_PASS] is False and "parent" not in x]
        for el in fields_to_be_upd:
            new_el = el.copy()
            el[NEW_VALUE] = el["valid_value"]
            new_el[NEW_VALUE] = el["valid_value"]
            new_el[params.NEW_VALUE_PASS] = True
            errors += audit_field(browser, new_el)
        # fix row:
        for row in rows:
            validation.select_sub_table_row_by_id(row_ids[row])
            inputs_to_be_set = [x for x in low_level_fields if x["row"] == row and x[params.NEW_VALUE_PASS] is False]
            for inp in inputs_to_be_set:
                inp["row_id"] = row_ids[row]
                inp[NEW_VALUE] = inp["valid_value"]
                new_input = inp.copy()
                new_input[params.NEW_VALUE_PASS] = True
                new_input[NEW_VALUE] = inp["valid_value"]
                errors += audit_field(browser, new_input)
        validation.save_form_changes()
        # check that alert successful is displayed
        alert_text = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected text in alert: {texts.SUCCESSFULLY_UPDATED} got {alert_text}")
        validation.confirm_alert()
        # check changes in DB:
        # pause 8 seconds
        time.sleep(3)
        updated_record = find_docs_in_collection(collection_name, {RECORD_ID: doc_id})
        """Check that CurrentState was updated for the high level fields edited by the user"""
        user_input_value = get_name_from_array(fields, AREA_KM2)
        if updated_record[CURRENT_STATE][AREA_KM2] != user_input_value:
            errors.append(
                f"CurrentState for {AREA_KM2} is {updated_record[CURRENT_STATE][AREA_KM2]}, expected value: {user_input_value}")

        user_input_value = get_name_from_array(fields, LEADER)
        if updated_record[CURRENT_STATE][LEADER] != user_input_value:
            errors.append(
                f"CurrentState for {LEADER} is {updated_record[CURRENT_STATE][LEADER]}, expected value: {user_input_value}")

        """Check that CurrentState was updated for the low level fields edited by the user"""
        user_input_value = get_name_from_array(fields, LEADER)
        if updated_record[CURRENT_STATE][LEADER] != user_input_value:
            errors.append(
                f"CurrentState for {LEADER} is {updated_record[CURRENT_STATE][LEADER]}, expected value: {user_input_value}")
        sub_range_to_be_upd = set([y["parent"] for y in fields if "parent" in y])
        for el in sub_range_to_be_upd:
            rows_to_be_upd = set([x["row_id"].replace(el, '') for x in fields if "parent" in x and x["parent"] == el])
            for row in rows_to_be_upd:
                keys_to_be_upd = [x for x in fields if "row_id" in x and x["row_id"] == f"{el}{row}"]
                # get all fields from low-level object: not always id is added even after pause
                upd_objs = [x for x in updated_record[CURRENT_STATE][el] if "_id" in x and str(x["_id"]) == row]
                if upd_objs:
                    upd_obj = upd_objs[0]
                    obj_before_upd = [x for x in record_from_db[CURRENT_STATE][el] if x["_id"] == upd_obj["_id"]][
                        0]
                    for key in keys_to_be_upd:
                        if key[TYPE] == DATE_TYPE:
                            if upd_obj[key[NAME]] != datetime.strftime(param_to_datetime(key),
                                                                       "%Y-%m-%dT%H:%M:%SZ"):
                                errors.append(
                                    f"Value for {key[NAME]} expected {datetime.strftime(param_to_datetime(key), '%Y-%m-%dT%H:%M:%SZ')} but got {upd_obj[key[NAME]]}")
                        else:
                            if upd_obj[key[NAME]] != key[NEW_VALUE]:
                                errors.append(
                                    f"Value for {key[NAME]} expected {key[NEW_VALUE]} but got {upd_obj[key[NAME]]}")
                    # check no other fields were updated:
                    should_not_be_upd_fields = [x for x in upd_obj.keys() if
                                                x not in [y[NAME] for y in keys_to_be_upd] and x not in [
                                                    "fx_margin",
                                                    "full_cost"]]
                    for snu in should_not_be_upd_fields:
                        if obj_before_upd[snu] != upd_obj[snu]:
                            errors.append(
                                f"Field {snu} was updated from {obj_before_upd[snu]} to {upd_obj[snu]} for {row}")
                    # check calculations:
                    calc_fx_margin = margins_calc(upd_obj['ib_rate'], upd_obj['fx_rate'])
                    if round(upd_obj["fx_margin"], 4) != round(calc_fx_margin, 4):
                        errors.append(f"expected fx_margin for {row} to be {calc_fx_margin} got {upd_obj['fx_margin']}")

                    calc_full_cost = full_cost_calc(upd_obj['ib_rate'], upd_obj['fx_rate'], upd_obj['fee'],
                                                    upd_obj['amount'])

                    if round(upd_obj["full_cost"], 4) != round(calc_full_cost, 4):
                        errors.append(f"expected full_cost for {row} to be {calc_full_cost} got {upd_obj['full_cost']}")
                    # row that should not be updated, remove last one as it's added:
                    rows_not_to_be_updated = [x for x in updated_record[CURRENT_STATE][el] if
                                              str(x["_id"]) not in rows_to_be_upd][: -1]
                    for row_not_to_be_updated in rows_not_to_be_updated:
                        row_before_upd = \
                            [x for x in record_from_db[CURRENT_STATE][el] if
                             x["_id"] == row_not_to_be_updated["_id"]][
                                0]
                        copy_row_not_to_be_updated = row_not_to_be_updated.copy()
                        copy_row_before_upd = row_before_upd.copy()
                        del copy_row_not_to_be_updated["_id"]
                        del copy_row_before_upd["_id"]
                        # exclude dependent fields:
                        del copy_row_not_to_be_updated["fx_margin"]
                        del copy_row_before_upd["fx_margin"]
                        del copy_row_not_to_be_updated["full_cost"]
                        del copy_row_before_upd["full_cost"]
                        if json.dumps(copy_row_not_to_be_updated) != json.dumps(copy_row_before_upd):
                            errors.append(
                                f"expected row was not updated for {str(copy_row_before_upd['_id'])} from {json.dumps(copy_row_before_upd)} to {json.dumps(copy_row_not_to_be_updated)}")
            # for added rows for ConsumerMargins:
            added_row_keys = updated_record[CURRENT_STATE]["ConsumerMargins"][-1].keys()
            for key in added_row_keys:
                user_input_list = [x for x in add_info if x[NAME] == key]
                if user_input_list:
                    if user_input_list[0][TYPE] == DATE_TYPE:
                        if updated_record[CURRENT_STATE]["ConsumerMargins"][-1][key] != datetime.strftime(
                                param_to_datetime(user_input_list[0]), "%Y-%m-%dT%H:%M:%SZ"):
                            errors.append(
                                f"Value for {key} is wrong")
                    else:
                        if updated_record[CURRENT_STATE]["ConsumerMargins"][-1][key] != user_input_list[0][
                            NEW_VALUE]:
                            errors.append(f"Value for {key} is wrong")
            # for added rows for CommercialMargins:
            added_row_keys = updated_record[CURRENT_STATE]["CommercialMargins"][-1].keys()
            for key in added_row_keys:
                user_input_list = [x for x in add_info_commercial if x[NAME] == key]
                if user_input_list:
                    if user_input_list[0][TYPE] == DATE_TYPE:
                        if updated_record[CURRENT_STATE]["CommercialMargins"][-1][key] != datetime.strftime(
                                param_to_datetime(user_input_list[0]), "%Y-%m-%dT%H:%M:%SZ"):
                            errors.append(
                                f"Value for {key} is wrong")
                    else:
                        if updated_record[CURRENT_STATE]["CommercialMargins"][-1][key] != \
                                user_input_list[0][NEW_VALUE]:
                            errors.append(f"Value for {key} is wrong")
            # check rows for ConsumerMargins, remove last row, remove first 2 rows as they were edited as it was added:
            rows_ids_after_upd = [str(x["_id"]) for x in updated_record[CURRENT_STATE]["ConsumerMargins"] if
                                  str(x["_id"]) not in rows_to_be_upd][:-1]
            # remove 2 last rows as they were removed
            rows_ids_before_upd = [str(x["_id"]) for x in record_from_db[CURRENT_STATE]["ConsumerMargins"] if
                                   str(x["_id"]) not in rows_to_be_upd][:-2]
            if rows_ids_after_upd != rows_ids_before_upd:
                errors.append(f"expected non changed object list: {rows_ids_before_upd} got {rows_ids_after_upd}")
            for el in rows_ids_before_upd:
                new_row_state = \
                    [x for x in updated_record[CURRENT_STATE]["ConsumerMargins"] if str(x["_id"]) == el][0]
                prev_row_state = \
                    [x for x in record_from_db[CURRENT_STATE]["ConsumerMargins"] if str(x["_id"]) == el][0]
                copy_prev_state = prev_row_state.copy()
                copy_new_row_state = new_row_state.copy()
                del copy_new_row_state["_id"]
                del copy_prev_state["_id"]
                if json.dumps(copy_new_row_state) != json.dumps(copy_prev_state):
                    errors.append(f"expected {el} was not changed")

            # check rows for CommercialMargins:
            rows_ids_after_upd_com = [str(x["_id"]) for x in updated_record[CURRENT_STATE]["CommercialMargins"]][
                                     :-1]
            # remove 2 last rows as they were removed
            rows_ids_before_upd_com = [str(x["_id"]) for x in record_from_db[CURRENT_STATE]["CommercialMargins"]]
            if rows_ids_after_upd_com != rows_ids_before_upd_com:
                errors.append(
                    f"expected non changed object list: {rows_ids_before_upd_com} got {rows_ids_after_upd_com}")
            for el_2 in rows_ids_before_upd_com:
                new_row_state = \
                    [x for x in updated_record[CURRENT_STATE]["CommercialMargins"] if str(x["_id"] == el_2)][0]
                prev_row_state = \
                    [x for x in record_from_db[CURRENT_STATE]["CommercialMargins"] if str(x["_id"] == el_2)][0]
                copy_prev_state = prev_row_state.copy()
                copy_new_row_state = new_row_state.copy()
                del copy_new_row_state["_id"]
                del copy_prev_state["_id"]

                if json.dumps(copy_new_row_state) != json.dumps(copy_prev_state):
                    errors.append(f"expected {el_2} was not changed")

            # check audit session:
            if updated_record[AUDIT_STATE][AUDIT_NUMBER] != 1:
                errors.append(
                    f"expected number of audits is 1, got {updated_record[AUDIT_STATE][AUDIT_NUMBER]}")
            cur_date = datetime.now()
            print(f"Last edited at: {updated_record[AUDIT_STATE][LAST_EDITED_AT]}")
            if updated_record[AUDIT_STATE][LAST_EDITED_AT][
               :updated_record[AUDIT_STATE][LAST_EDITED_AT].index("T")] != datetime.strftime(cur_date,
                                                                                             "%Y-%m-%d"):
                errors.append(f"expected {LAST_EDITED_AT} to be {datetime.strftime(cur_date, '%Y-%m-%d')}")
            if updated_record[AUDIT_STATE][LAST_EDITED_BY] != os.getenv("DV_USER"):
                errors.append(
                    f"expected {LAST_EDITED_BY} to be {os.getenv('DV_USER')} got {updated_record[AUDIT_STATE][LAST_EDITED_BY]}")
            if updated_record[AUDIT_STATE][CONFIDENCE_SCORE]:
                errors.append(
                    f"expected empty {CONFIDENCE_SCORE}, got {updated_record[AUDIT_STATE][CONFIDENCE_SCORE]}")
            if updated_record[AUDIT_STATE][NOTE_ON_CONFIDENCE_SCORE]:
                errors.append(
                    f"expected empty {NOTE_ON_CONFIDENCE_SCORE}, got {updated_record[AUDIT_STATE][NOTE_ON_CONFIDENCE_SCORE]}")
            # check audited value array:
            # get audit for high order fields:
            high_order_fields = [x for x in fields if "parent" not in x]
            for hof in high_order_fields:
                audit = [x for x in updated_record[AUDIT_SESSIONS][-1][AUDIT_VALUE_ARRAY] if
                         x[AUDIT_FIELD_NAME] == hof[NAME]]
                if len(audit) != 1:
                    errors.append(f"expected 1 audit for the field {hof[NAME]}, got {len(audit)}")
                else:
                    if hof[TYPE] == DATE_TYPE:
                        if audit[0][NEW_VALUE] != datetime.strftime(param_to_datetime(hof), "%Y-%m-%dT%H:%M:%SZ"):
                            errors.append(
                                f"expected new value {datetime.strftime(param_to_datetime(hof), '%Y-%m-%dT%H:%M:%SZ')} for audited field {hof[NAME]} got {audit[0][NEW_VALUE]}")
                    else:
                        if audit[0][NEW_VALUE] != hof[NEW_VALUE]:
                            errors.append(
                                f"expected new value {hof[NEW_VALUE]} for audited field {hof[NAME]} got {audit[0][NEW_VALUE]}")
            # for low-level fields that were edited:
            low_level_fields = [x for x in fields if "parent" in x]
            for lof in low_level_fields:
                low_audit = [y for y in updated_record[AUDIT_SESSIONS][-1][
                    AUDIT_VALUE_ARRAY] if y[
                                 AUDIT_FIELD_NAME] == f"{lof['parent']}.{lof['row_id'].replace(lof['parent'], '')}.{lof[NAME]}"]
                if len(low_audit) != 1:
                    errors.append(f"expected 1 audit for the field {lof}, got {len(low_audit)}")
                else:
                    if lof[TYPE] == DATE_TYPE:
                        if low_audit[0][NEW_VALUE] != datetime.strftime(param_to_datetime(lof),
                                                                        "%Y-%m-%dT%H:%M:%SZ"):
                            errors.append(
                                f"expected new value {datetime.strftime(param_to_datetime(lof), '%Y-%m-%dT%H:%M:%SZ')} for audited field {lof[NAME]} {lof['row_id']} got {low_audit[0][NEW_VALUE]}")
                    else:
                        if low_audit[0][NEW_VALUE] != lof[NEW_VALUE]:
                            errors.append(
                                f"expected new value {lof[NEW_VALUE]} for audited field {lof[NAME]} {lof['row_id']} got {low_audit[0][NEW_VALUE]}")

            # for added fields:
            added_audits_consumer = [x for x in updated_record[AUDIT_SESSIONS][-1][
                AUDIT_VALUE_ARRAY] if x[AUDITED_COMMENT] and "Add" in x[
                                         AUDITED_COMMENT] and x[
                                         AUDIT_FIELD_NAME] == "ConsumerMargins"]
            added_audits_commercial = [x for x in updated_record[AUDIT_SESSIONS][-1][
                AUDIT_VALUE_ARRAY] if x[AUDITED_COMMENT] and "Add" in x[
                                           AUDITED_COMMENT] and x[
                                           AUDIT_FIELD_NAME] == "CommercialMargins"]
            if len(added_audits_consumer) != 1:
                errors.append(f"expected 1 audit is set for 1 added ConsumerMargins row")
            else:
                if added_audits_consumer[0][OLD_VALUE] is not None:
                    errors.append(f"expected empty value for {OLD_VALUE} for added row for CommercialMargins")
                if added_audits_consumer[0][NEW_VALUE] is not None:
                    for key in added_audits_consumer[0][NEW_VALUE].keys():
                        user_edited = [x for x in add_info if x[NAME] == key]
                        if user_edited:
                            if user_edited[0][TYPE] == DATE_TYPE:
                                if datetime.strftime(
                                        param_to_datetime(user_edited[0]), "%Y-%m-%dT%H:%M:%SZ") != \
                                        added_audits_consumer[0][NEW_VALUE][key]:
                                    errors.append(
                                        f"expected value for added ConsumerMargins field {user_edited[0][NAME]} is wrong")
                            else:
                                if user_edited[0][NEW_VALUE] != added_audits_consumer[0][
                                    NEW_VALUE][key]:
                                    errors.append(
                                        f"expected value for added ConsumerMargins field {user_edited[0][NAME]} is wrong")
                        else:
                            # check calculations and other fields to be empty:
                            if key in ["fx_margin", "full_cost"]:
                                if round(margins_calc(added_audits_consumer[0][NEW_VALUE]["ib_rate"],
                                                      added_audits_consumer[0][NEW_VALUE]["fx_rate"]), 4) != \
                                        round(added_audits_consumer[0][NEW_VALUE]["fx_margin"], 4):
                                    errors.append(
                                        f"wrong calculations for fx_margin for added row for ConsumerMargins, expected: ")
                                if round(full_cost_calc(added_audits_consumer[0][NEW_VALUE]["ib_rate"],
                                                        added_audits_consumer[0][NEW_VALUE]["fx_rate"],
                                                        added_audits_consumer[0][NEW_VALUE]["fee"],
                                                        added_audits_consumer[0][NEW_VALUE]["amount"]), 4) != \
                                        round(added_audits_consumer[0][NEW_VALUE]["full_cost"], 4):
                                    errors.append(f"wrong calculations for full_cost for added row for ConsumerMargins")
                            elif key not in ["fx_margin", "full_cost", "_id"]:
                                if added_audits_consumer[0][NEW_VALUE][key]:
                                    errors.append(f"expected empty value for not set and calculated field")

            if len(added_audits_commercial) != 1:
                errors.append(f"expected 1 audit is set for 1 added {COMMERCIAL_MARGINS} row")
            else:
                if added_audits_commercial[0][OLD_VALUE] is not None:
                    errors.append(
                        f"expected empty value for {OLD_VALUE} for added row for {COMMERCIAL_MARGINS}")
                if added_audits_commercial[0][NEW_VALUE] is not None:
                    for key in added_audits_commercial[0][NEW_VALUE].keys():
                        user_edited = [x for x in add_info_commercial if x[NAME] == key]
                        if user_edited:
                            if user_edited[0][TYPE] == DATE_TYPE:
                                if datetime.strftime(
                                        param_to_datetime(user_edited[0]), "%Y-%m-%dT%H:%M:%SZ") != \
                                        added_audits_commercial[0][NEW_VALUE][key]:
                                    errors.append(
                                        f"expected value for added {COMMERCIAL_MARGINS} field {user_edited[0][NAME]} is wrong")
                            else:
                                if user_edited[0][NEW_VALUE] != added_audits_commercial[0][
                                    NEW_VALUE][
                                    key]:
                                    errors.append(
                                        f"expected value for added {COMMERCIAL_MARGINS} field {user_edited[0][NAME]} is wrong")
                        else:
                            # check calculations and other fields to be empty:
                            if key in ["fx_margin", "full_cost"]:
                                if round(margins_calc(added_audits_commercial[0][NEW_VALUE]["ib_rate"],
                                                      added_audits_commercial[0][NEW_VALUE]["fx_rate"]), 4) != \
                                        round(added_audits_commercial[0][NEW_VALUE]["fx_margin"], 4):
                                    errors.append(
                                        f"wrong calculations for fx_margin for added row for {COMMERCIAL_MARGINS}, expected: ")
                                if round(full_cost_calc(added_audits_commercial[0][NEW_VALUE]["ib_rate"],
                                                        added_audits_commercial[0][NEW_VALUE]["fx_rate"],
                                                        added_audits_commercial[0][NEW_VALUE]["fee"],
                                                        added_audits_commercial[0][NEW_VALUE]["amount"]), 4) != \
                                        round(added_audits_commercial[0][NEW_VALUE]["full_cost"], 4):
                                    errors.append(
                                        f"wrong calculations for full_cost for added row for {COMMERCIAL_MARGINS}")
                            elif key not in ["fx_margin", "full_cost", "_id"]:
                                if added_audits_commercial[0][NEW_VALUE][key]:
                                    errors.append(f"expected empty value for not set and calculated field")
                else:
                    errors.append(
                        f"expected non-empty value for {NEW_VALUE} for added row for {COMMERCIAL_MARGINS}")
            # for removed fields
            removed_audits = [x for x in updated_record[AUDIT_SESSIONS][-1][
                AUDIT_VALUE_ARRAY] if
                              x[AUDITED_COMMENT] and "Remove" in x[AUDITED_COMMENT] and x[
                                  AUDIT_FIELD_NAME] == CONSUMER_MARGINS]
            if len(removed_audits) != 2:
                errors.append(
                    f"expected number of removed fields to be 2")
            else:
                # check list of ids:
                list_of_removed_rows = [str(x[OLD_VALUE]["_id"]) for x in removed_audits]
                if sorted(list_of_removed_rows) != sorted(
                        [row_ids[-2].replace(CONSUMER_MARGINS, ''), row_ids[-1].replace(CONSUMER_MARGINS, '')]):
                    errors.append(
                        f"expected list of removed rows to be: {sorted([row_ids[-2].replace(CONSUMER_MARGINS, ''), row_ids[-1].replace(CONSUMER_MARGINS, '')])} but received {sorted(list_of_removed_rows)}")
                for ra in removed_audits:
                    if ra[NEW_VALUE]:
                        errors.append(f"expected new value to be empty but got {ra[NEW_VALUE]}")
                    audit_old_after_remove = ra[OLD_VALUE].copy()
                    audit_old_before_remove = [x for x in
                                               record_from_db[CURRENT_STATE][
                                                   CONSUMER_MARGINS] if
                                               x["_id"] == audit_old_after_remove["_id"]][0].copy()
                    del audit_old_after_remove["_id"]
                    del audit_old_before_remove["_id"]
                    if audit_old_before_remove != audit_old_after_remove:
                        errors.append(
                            f"expected no changes in {OLD_VALUE} in audit session")
                    if ra[VALID]:
                        errors.append(
                            f"expected field valid in audit session to be false, received true")

            assert errors == []

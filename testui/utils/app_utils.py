import copy
import json
import os
import time
from datetime import datetime, timedelta

import pymongo
import pytest

from dbutil.db_utils import get_elk_logs, find_docs_in_collection
from pages.validation.validation_page_actions import ValidationPage
from params import db_params
from params import params
from params import texts
from utils.common_utils import is_date, is_num


def reformat_date(form_data, db_data):
    if is_date(form_data):
        return datetime.strftime(db_data, "%Y-%m-%d %H:%M:%SZ")
    else:
        return str(db_data)


def param_to_datetime(field):
    if params.TIME in field and (field[params.TIME] is not None):
        d_time = datetime.strptime(f"{field[db_params.NEW_VALUE]} {field['time']}", '%Y-%m-%d %I:%M %p')
        if params.UTC in field and field[params.UTC] != 0:
            return d_time - timedelta(hours=field[params.UTC])

        new_time = datetime.min.time()
        return datetime.combine(datetime.strptime(field[db_params.NEW_VALUE], '%Y-%m-%d'), new_time)
    else:
        return field[db_params.NEW_VALUE]


def check_fields_on_form_values(on_form, to_be_displayed):
    errors = []
    if set(on_form) != set(to_be_displayed):
        errors.append(f"fields to be displayed: {set(to_be_displayed)}, got on form: {set(on_form)}")
    return errors


def check_sub_range_values_on_form(fields_with_sub_ranges, current_state, validation):
    errors = []
    for el in fields_with_sub_ranges:
        # get ids from DB:
        sub_field_ids = [str(x["_id"]) for x in current_state[el]]
        for i in sub_field_ids:
            values_from_form = validation.get_sub_range_fields_and_values(el, i)
            for k in values_from_form.keys():
                # get val from dbutil:
                db_rec = [x for x in current_state[el] if str(x["_id"]) == i][0]
                db_val = reformat_date(values_from_form[k], db_rec)
                if db_val != values_from_form[k]:
                    errors.append(f"Subrange for {el}.{i} is {db_val} in DB and {values_from_form[k]} on form")
    return errors


def check_dropdown(field_list, validation_page, dropdown_present=True):
    errors = []
    for field in field_list:
        if not validation_page.check_dropdown(field, dropdown_present):
            errors.append(f"expected dropdown is not visible for {field}")
    return errors


def check_score_required_notification(doc_config, score, validation):
    errors = []
    if doc_config[db_params.CONFIDENCE_SCORE_REQUIRED] and not score and not validation.check_required_notif():
        errors.append(f"missing notification about required field")
    return errors


def reformat_input_data(field_changed, new_value=True):
    if new_value:
        param = db_params.NEW_VALUE
    else:
        param = db_params.OLD_VALUE

    if is_date(str(field_changed[param])):
        return datetime.strftime(param_to_datetime(field_changed), '%Y-%m-%dT%H:%M:%SZ')
    elif isinstance(field_changed[param], (list, set, tuple)):
        return ",".join(field_changed[param])
    else:
        return field_changed[param]


def map_confidence_score_by_value(doc_config, confidence_score_from_doc):
    if db_params.CONFIDENCE_SCORES in doc_config:
        return int(list(doc_config[db_params.CONFIDENCE_SCORES][
                            db_params.CONFIDENCE_SCORE_OPTIONS].values())[
                       list(doc_config[db_params.CONFIDENCE_SCORES][
                                db_params.CONFIDENCE_SCORE_OPTIONS].keys()).index(
                           confidence_score_from_doc)])

    else:
        return list(db_params.DEFAULT_SCORE_MAP.values())[
            list(db_params.DEFAULT_SCORE_MAP.keys()).index(confidence_score_from_doc)]


def map_confidence_score_by_key(doc_config, confidence_score_from_doc):
    if db_params.CONFIDENCE_SCORES in doc_config:
        return list(doc_config[db_params.CONFIDENCE_SCORES][db_params.CONFIDENCE_SCORE_OPTIONS].keys())[
            list(doc_config[db_params.CONFIDENCE_SCORES][db_params.CONFIDENCE_SCORE_OPTIONS].values()).index(
                confidence_score_from_doc)]

    else:
        return list(db_params.DEFAULT_SCORE_MAP.values())[
            list(db_params.DEFAULT_SCORE_MAP.keys()).index(confidence_score_from_doc)]


def audit_field(browser, field, added=False, apply_to_all=False, close_dropdown=False):
    """Use method validation.select_margin_row_by_id(row_id) for selecting row before auditing low-level rows
    :param close_dropdown:
    :param field: field as dictionary that will be validated
    :param apply_to_all: True - bulk changes apply
    :param added: False or True
    :param browser:
    :param cell_name: field with cell name
    """
    index = field[params.INDEX] if params.INDEX in field else 0
    if added:
        field[db_params.VALID] = False
    validation = ValidationPage(browser)
    errors = []
    if params.TIME in field:
        time_val = field[params.TIME]
    else:
        time_val = None
    if not field[db_params.VALID] and field[db_params.TYPE] == db_params.DATE_TYPE and (
            params.MIXED_VALUE not in field or field[params.MIXED_VALUE] is False) and (
            db_params.NEW_VALUE in field and field[
        db_params.NEW_VALUE] is not None):
        full_date = datetime.strptime(field[db_params.NEW_VALUE], '%Y-%m-%d')
        day = full_date.day
        month = full_date.month
        year = full_date.year
    else:
        day = None
        month = None
        year = None
    if params.PARENT in field:
        table_name = field[params.PARENT]
        if not added:
            validation.validate_sub_field(field[params.ROW_ID], field[db_params.NAME], field[db_params.VALID])
        if not field[db_params.VALID]:
            if apply_to_all:
                validation.set_bulk_changes_checkbox(field[params.PARENT],
                                                     field[params.ROW_ID].replace(field[
                                                                                      params.PARENT], ''),
                                                     field[db_params.NAME], True)
            else:
                validation.set_bulk_changes_checkbox(field[params.PARENT],
                                                     field[params.ROW_ID].replace(field[
                                                                                      params.PARENT], ''),
                                                     field[db_params.NAME], False)
            if field[db_params.TYPE] == db_params.DATE_TYPE:
                if params.MIXED_VALUE in field and field[params.MIXED_VALUE]:
                    validation.set_new_subrange_value(field[params.PARENT], field[db_params.NAME],
                                                      str(field[db_params.NEW_VALUE]))
                else:
                    validation.select_cal_date_and_time(field[db_params.NAME], day, month,
                                                        year, errors, time_val,
                                                        field[params.PARENT])
            elif field[db_params.TYPE] in (
                    db_params.ENUM, db_params.BOOL) and db_params.NEW_VALUE in field and field[
                db_params.NEW_VALUE] is not None:
                validation.select_value_input(field[db_params.NEW_VALUE],
                                              field[db_params.NAME],
                                              field[params.ROW_ID], table_name)
            elif db_params.NEW_VALUE in field and field[db_params.NEW_VALUE] is not None:
                validation.set_new_subrange_value(field["parent"], field[db_params.NAME],
                                                  str(field[db_params.NEW_VALUE]))

    else:
        validation.set_dropdown_is_valid(field[db_params.NAME], field[db_params.VALID], index)
        if not field[db_params.VALID] and db_params.NEW_VALUE in field:
            if field[db_params.TYPE] == db_params.DATE_TYPE:
                if params.MIXED_VALUE in field and field[params.MIXED_VALUE]:
                    validation.set_new_valid_value(field[db_params.NAME],
                                                   str(field[db_params.NEW_VALUE]), index, True)
                else:
                    validation.select_cal_date_and_time(field[db_params.NAME], day, month,
                                                        year, errors, time_val, index=index)
            elif field[db_params.TYPE] in (db_params.ENUM, db_params.BOOL):
                validation.select_value_input(field[db_params.NEW_VALUE],
                                              field[db_params.NAME], index=index)
            else:
                validation.set_new_valid_value(field[db_params.NAME],
                                               str(field[db_params.NEW_VALUE]), index)
    if not field[db_params.VALID] and field[db_params.TYPE] == db_params.DATE_TYPE:
        if params.UTC in field and field[params.UTC] != 0:
            if params.PARENT in field:
                row_id = field[params.ROW_ID]
                table_name = field[params.PARENT]
            else:
                row_id = None
                table_name = None
            validation.set_utc_diff(field[params.UTC], field[db_params.NAME], row_id, table_name, index)

    if not field[db_params.VALID] and db_params.COMMENT in field:
        validation.set_comment(field[db_params.NAME], str(field[db_params.COMMENT]), index)
    if close_dropdown:
        validation.click_on_body()
    time.sleep(1)
    return errors


def check_is_pass(browser, fields):
    errors = []
    validation = ValidationPage(browser)
    if all([x[params.NEW_VALUE_PASS] for x in fields]):
        alert_text = validation.get_alert_text()
        if texts.SUCCESSFULLY_UPDATED not in alert_text:
            errors.append(f"expected text in alert to contain {texts.SUCCESSFULLY_UPDATED} got: {alert_text}")
    else:
        # check notifications for each non-pass field:
        for field in [x for x in fields if x[params.NEW_VALUE_PASS] is False]:
            if params.PARENT in field:
                table_name = field[params.PARENT]
            else:
                table_name = None
            if not validation.get_notification(
                    field[db_params.NAME], table_name):
                errors.append(f"missing notification for non-valid value field")
    return errors


def compare_audit_popup_with_user_input(audit_text, field):
    errors = []
    if audit_text[0][audit_text[0].index(":") + 2:] != os.getenv("DV_USER"):
        errors.append(
            f"expected audited info updated by: {os.getenv('DV_USER')} got {audit_text[0][audit_text[0].index(':') + 2:]}")
    if datetime.strptime(audit_text[1][audit_text[1].index(":") + 2:],
                         "%Y-%m-%dT%H:%M:%S.%fZ").date() != datetime.now().date():
        errors.append(
            f"expected audited info updated datetime is not correct")
    if audit_text[3][audit_text[3].index(":") + 2:]:
        errors.append(
            f"expected None value to be previous, received: {audit_text[3][audit_text[3].index(':') + 2:]}")
    if audit_text[4][audit_text[4].index(":") + 2:] != field[db_params.COMMENT]:
        errors.append(
            f"expected comment to be {field[db_params.COMMENT]}, received: {audit_text[4][audit_text[4].index(':') + 2:]}")
    return errors


def compare_elk_logs(dt, audit_session=None, collection=None, update_success=None, notification=None,
                     global_pipeline_description=None, number_of_global=None, logtype=None, audited_fields=None,
                     total_upd_number=None):
    errors = []
    time.sleep(10)
    elk_info = get_elk_logs(dt)
    if not elk_info:
        errors.append("expected logs to be written")
    if logtype is not None:
        elk_type_logs = [x for x in elk_info if x["_source"]["log_type"].lower() == logtype.lower()]
    else:
        elk_type_logs = elk_info
    if total_upd_number is not None and total_upd_number != len(elk_type_logs):
        errors.append(
            f"expected number of updates for log_type: {logtype} to be {total_upd_number} got {len(elk_type_logs)}")
    for info in elk_type_logs:
        # todo: add check for audit type
        if "AuditSession" in info["_source"]:
            audited_field = json.loads(info["_source"]["AuditSession"])[db_params.AUDIT_FIELD_NAME]
            if audit_session:
                audit_info = [x for x in audit_session if x[db_params.AUDIT_FIELD_NAME] == audited_field]
            elif audited_fields:
                audit_info = audited_field
            else:
                audit_info = None
            if audit_info:
                if audit_info[0][db_params.NEW_VALUE] != json.loads(info["_source"]["AuditSession"])["new_value"]:
                    errors.append(
                        f"""expected new value info to be {audit_info[0][db_params.NEW_VALUE]} got {json.loads(info["_source"]["AuditSession"])["new_value"]}""")
                if audit_info[0][db_params.OLD_VALUE] != json.loads(info["_source"]["AuditSession"])["old_value"]:
                    errors.append(
                        f"""expected new value info to be {audit_info[0][db_params.OLD_VALUE]} got {json.loads(info["_source"]["AuditSession"])["old_value"]}""")
                if audit_info[0][db_params.AUDITED_COMMENT] != json.loads(info["_source"]["AuditSession"])[
                    db_params.AUDITED_COMMENT]:
                    errors.append(
                        f"""expected new value info to be {audit_info[0][db_params.AUDITED_COMMENT]} got {json.loads(info["_source"]["AuditSession"])[db_params.AUDITED_COMMENT]}""")

                if info["_source"]["log_type"] != texts.MANUAL_AUDIT:
                    errors.append(
                        f"""expected audit type to be {texts.MANUAL_AUDIT}, got {info["_source"]["log_type"]}""")
        else:
            if global_pipeline_description and info["_source"]["global_update_pipeline"][
                "description"] not in global_pipeline_description:
                errors.append(f"expected pipeline to be in the list")
        if os.getenv("DV_USER") != info["_source"]["user"]:
            errors.append(f"expected user in kibana to be {os.getenv('DV_USER')}, got {info['_source']['user']}")
        if collection and collection != info["_source"]["collection"]:
            errors.append(f"""expected collection to be {collection}, got {info["_source"]["collection"]}""")
        if update_success is not None and update_success != info["_source"]["update_success"]:
            errors.append(
                f"""expected update_success to be {update_success}, got {info["_source"]["update_success"]}""")
        if notification:
            if not [x for x in info["_source"]["error_message"] if notification in x]:
                errors.append(f"notification {notification} is not in kibana list")
    if number_of_global is not None and len(
            [x for x in elk_info if x["_source"][params.LOG_TYPE] == texts.GLOBAL_UPDATE]) != number_of_global:
        errors.append(
            f"expected length of global update audits to be {number_of_global}, got {len([x for x in elk_info if x['_source'][params.LOG_TYPE] == texts.GLOBAL_UPDATE])}")
    return errors


def compare_audits(audit_value_array_item, field_name, field_old_value, field_new_value, field_valid, field_comment):
    errors = []
    if audit_value_array_item[db_params.AUDIT_FIELD_NAME] != field_name:
        errors.append(
            f"""Expected field name in audit to be {field_name}, got {audit_value_array_item[db_params.AUDIT_FIELD_NAME]}""")

    if audit_value_array_item[db_params.OLD_VALUE] != field_old_value:
        errors.append(
            f"""Expected field old value in audit to be {field_old_value}, got {audit_value_array_item[db_params.OLD_VALUE]}""")
    if audit_value_array_item[db_params.NEW_VALUE] != field_new_value:
        errors.append(
            f"""Expected field new value in audit to be {field_new_value}, got {audit_value_array_item[db_params.NEW_VALUE]}""")
    if audit_value_array_item[db_params.VALID] != field_valid:
        errors.append(
            f"""Expected field valid to be {field_valid}, got {audit_value_array_item[db_params.VALID]}""")

    if audit_value_array_item[db_params.AUDITED_COMMENT] != field_comment:
        errors.append(
            f"""Expected field comment to be {field_comment}, got {audit_value_array_item[db_params.AUDITED_COMMENT]}""")
    return errors


def global_upd_pipeline(browser, col_config, collection_name, doc_id=None):
    creds = os.getenv("DB_CREDS")
    client = pymongo.MongoClient(creds)
    db = client[db_params.DB_NAME]
    pipes = [x for x in col_config["global_automatic_updates"]]
    for pipe in pipes:
        res = list(db[collection_name].aggregate(json.loads(pipe["aggregation_pipeline"].replace("'", '"'))))
        if doc_id:
            x = {}
            doc = find_docs_in_collection(collection_name, {db_params.RECORD_ID: doc_id})
            for match_field in pipe["matching_fields"]:
                x[match_field] = doc[db_params.CURRENT_STATE][match_field]
            matcher_records = [y for y in res if x.items() <= y.items()]
            for match_rec in matcher_records:
                upd_fields = apply_pipeline(browser, doc, match_rec, pipe)
                db[collection_name].update_one({db_params.RECORD_ID: doc[db_params.RECORD_ID]}, upd_fields)

        else:
            for r in res:
                ar = []
                for match_field in pipe["matching_fields"]:
                    a = {f"{db_params.CURRENT_STATE}.{match_field}": r[match_field]}
                    ar.append(a)
                to_be_upd = find_docs_in_collection(collection_name, {'$and': ar}, False)
                r_copy = copy.deepcopy(r)
                if "results" in r_copy:
                    del r_copy["results"]
                if to_be_upd:
                    for doc in to_be_upd:
                        set_fields = apply_pipeline(browser, doc, r, pipe)
                        db[collection_name].update_one({db_params.RECORD_ID: doc[db_params.RECORD_ID]}, set_fields)


def apply_pipeline(browser, doc, matched_record_from_aggr, pipe):
    rec_cur_state_from_db = doc[db_params.CURRENT_STATE]
    if db_params.AUDIT_SESSIONS in doc:
        audited_sessions = doc[db_params.AUDIT_SESSIONS]
        audited_values = [x[db_params.AUDIT_VALUE_ARRAY] for x in audited_sessions]
        audited_fields = [item[db_params.AUDIT_FIELD_NAME] for sublist in audited_values for item in
                          sublist]
    else:
        audited_fields = []
    rec = copy.deepcopy(rec_cur_state_from_db)
    for x in rec[db_params.AMOUNTS_AND_RATES]:
        del x["datetime_collected_utc"]
        x["_id"] = str(x["_id"])
    del rec["datetime_record_submitted_utc"]

    aggr_f = f"aggr{rec, matched_record_from_aggr};".replace("None", "null").replace("True", "true").replace(
        "False",
        "false").replace(
        "nan", "null").replace("inf", "Infinity")
    func_res = browser.execute_script(
        f"aggr=(CurrentState, aggr_result)=>" + f"{pipe['update_function']}" + ";a = " + aggr_f + "return JSON.stringify(a)")
    # remove fields that were updated manually
    fields_to_be_upd = json.loads(func_res)
    iter_fields_to_be_upd = copy.deepcopy(fields_to_be_upd)
    for k in fields_to_be_upd["$set"].keys():
        x = copy.deepcopy(doc)
        if k.find(".") != -1:
            for i in k.split(".")[:-1]:
                if is_num(i) != ValueError:
                    x = x[int(i)]
                else:
                    if i not in x:
                        break
                    else:
                        x = x[i]
            if type(x) == dict and "_id" in x:
                if f"{db_params.AMOUNTS_AND_RATES}.{str(x['_id'])}.{k.split('.')[-1]}" in audited_fields:
                    del iter_fields_to_be_upd["$set"][k]
            else:
                if x in audited_fields:
                    del iter_fields_to_be_upd["$set"][k]
    return iter_fields_to_be_upd

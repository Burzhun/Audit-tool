import os
import time
from pathlib import Path

import pytest
from faker import Faker

from conftest import doc_it
from dbutil.db_utils import find_docs_in_collection, update_mongo
from pages.validation.validation_page_actions import ValidationPage
from params import db_params
from params import params
from utils.app_actions import login_and_go_to_url

def handle_data_changes(data, errors):
    if data["was_data"] != data[db_params.OLD_VALUE]:
        errors.append(f"in audit old value: {data[db_params.OLD_VALUE]}, was in doc: {data['was_data']}")
    if data["is_data"] != data[db_params.NEW_VALUE]:
        errors.append(f"in audit new value: {data[db_params.NEW_VALUE]}, was in doc: {data['is_data']}")
    if data[db_params.TYPE] == db_params.UPLOAD:
        audit_comment = f"{db_params.UPLOAD} {os.getenv('S3_IMG_PATH')}"
        added_img = data["is_data"][-1]
        date_unix = int((added_img[added_img.rfind('/') + 1:added_img.rfind('.')])[1:-3])
        cur_time = int(time.time())
        if (cur_time - date_unix) > 5000:
            errors.append(f"check image time for added img")
        if len(data["was_data"]) + 1 != len(data["is_data"]):
            errors.append(f"expected current img number incremented, but it stayed the same")
        if data[db_params.OLD_VALUE] not in data[db_params.NEW_VALUE] and len(data[
                                                                                  db_params.OLD_VALUE]) + 1 != len(
            data[db_params.NEW_VALUE]):
            errors.append(
                f"expected array after edit: {data[db_params.OLD_VALUE].append(data['changed'])}, got {data[db_params.NEW_VALUE]}")
    elif data[db_params.TYPE] == db_params.EDIT:
        audit_comment = f"""{db_params.EDIT} {data['changed']} at position {data["position"]}"""
        if data["was_data"] != data["is_data"]:
            errors.append(f"expected array after edit is the same as in current state")
    elif data[db_params.TYPE] == db_params.REPLACE:
        audit_comment = f"{db_params.REPLACE} {data['old_img_link']} at position {data['position']} with"
        data["was_data"][data["position"]] = data["changed"]
        # todo: check if current data should be changed?
        if data["is_data"] != data["was_data"]:
            errors.append(f"expected array after replace to be: {data['was_data']}, got: {data['is_data']}")
    elif data[db_params.TYPE] == db_params.REMOVE:
        # position = data['position']
        audit_comment = f"{db_params.REMOVE} {data['changed']} at position {data['position']}"
        del data["was_data"][data["position"]]
        if data["is_data"] != data["was_data"]:
            errors.append(f"expected array after remove to be: {data['was_data']}, got: {data['is_data']}")
    # check audit_comment:
    if audit_comment not in data[db_params.AUDITED_COMMENT]:
        errors.append(f"expected comment: {audit_comment}, got: {data[db_params.AUDITED_COMMENT]}")
    # check audited category:
    if data[db_params.AUDIT_FIELD_NAME] != f"{db_params.IMAGE_LINKS}.{data['category_name']}":
        errors.append(f"received audit name: {data[db_params.AUDIT_FIELD_NAME]}")
    return errors


@pytest.mark.usefixtures("remove_files")
class TestImageWithoutGenData:
    @doc_it()
    @pytest.mark.img_handling
    @pytest.mark.parametrize("collection_name", [db_params.TESTING_HALINA])
    def test_image_validation(self, browser, collection_name, gen_data):
        errors = []
        doc_id = 3
        login_and_go_to_url(browser, collection_name, doc_id)
        # check records:
        record_from_db_1 = find_docs_in_collection(db_params.TESTING_HALINA, {db_params.RECORD_ID: doc_id})
        validation = ValidationPage(browser)
        # check image links:
        db_doc_img = record_from_db_1["CurrentState"]["ImageLinks"].keys()

        form_categories = validation.get_all_img_categories()
        if [x for x in db_doc_img if x not in form_categories]:
            errors.append(
                f"displayed categories list on form are: {form_categories}, in DB: {db_doc_img}")
        # check images in non-empty categories and btn upload for empty:
        for category in db_doc_img:
            validation.get_img_from_category(category)

            img_number_from_doc = len(record_from_db_1["CurrentState"]["ImageLinks"][category])
            img_number_on_form = validation.check_number_of_img_in_category()
            if img_number_on_form != img_number_from_doc:
                errors.append(
                    f"number of img in doc: {img_number_from_doc} but on form: {img_number_on_form}")
            if img_number_from_doc == 0 and not validation.upload_img():
                errors.append(f"expected upload img button to be present on form")
            elif img_number_from_doc > 0:
                # and not validation.check_img_displayed():
                # errors.append(f"img is not visible on the form")
                # elif img_number_from_doc > 0 and validation.check_img_displayed()
                for item in range(1, img_number_from_doc):
                    if not validation.get_image_attributes(item):
                        errors.append(f"expected tab is active for img {item}")
                    else:
                        # check btns for image are present
                        if not validation.img_btn_handle("replace", 1) or not validation.img_btn_handle("remove",
                                                                                                        1) or not validation.img_btn_handle(
                            "edit", 1):
                            errors.append(f"image btns are not visible")
                # add new image:
                # get current category:
                current_category_name = validation.get_active_category_name()
                img_path = f"""{str(Path(__file__).parents[2])}/params/files/{params.IMG_1}"""
                validation.img_btn_handle("add", 2)
                if validation.img_btn_handle("load", 1):
                    validation.upload_img(True, img_path)
                record_from_db_2 = find_docs_in_collection(db_params.TESTING_HALINA, {
                    db_params.RECORD_ID: doc_id})
                img_before_add = record_from_db_1[db_params.CURRENT_STATE][db_params.IMAGE_LINKS][current_category_name]
                img_after_add = record_from_db_2[db_params.CURRENT_STATE][db_params.IMAGE_LINKS][current_category_name]
                if db_params.AUDIT_SESSIONS in record_from_db_1:
                    audit_session_before_add = record_from_db_1[db_params.AUDIT_SESSIONS]
                else:
                    audit_session_before_add = []
                audit_session_after_add = record_from_db_2[db_params.AUDIT_SESSIONS]
                audit_diff_after_add = [x for x in audit_session_after_add if x not in audit_session_before_add]

                data = {
                    db_params.TYPE: db_params.UPLOAD,
                    "changed": params.IMG_1,
                    "category_name": current_category_name,
                    "was_data": img_before_add,
                    "is_data": img_after_add,
                    db_params.NEW_VALUE: "",
                    db_params.OLD_VALUE: "",
                    db_params.AUDIT_FIELD_NAME: ""
                }

                if len(audit_diff_after_add) != 1:
                    errors.append(f"expected number of images +1, got {len(audit_diff_after_add)}")

                # check diff:
                audit_log_after_add = audit_diff_after_add[0]
                added_img = audit_log_after_add[db_params.AUDIT_VALUE_ARRAY][0]
                data[db_params.OLD_VALUE] = added_img[db_params.OLD_VALUE]
                data[db_params.NEW_VALUE] = added_img[db_params.NEW_VALUE]
                data[db_params.AUDITED_COMMENT] = added_img[db_params.AUDITED_COMMENT]
                data[db_params.AUDIT_FIELD_NAME] = added_img[db_params.AUDIT_FIELD_NAME]

                errors = handle_data_changes(data, errors)
                # check other log:
                if audit_log_after_add[db_params.REGISTERED_USER_EMAIL] != os.getenv("DV_USER"):
                    errors.append(
                        f"data after add was changed by {os.getenv('DV_USER')} but received in AuditSession for the field RegisteredUserEmail: {audit_log_after_add['RegisteredUserEmail']}")
                # get last image and edit it
                img_number_after_add = validation.check_number_of_img_in_category()
                if img_number_on_form + 1 != img_number_after_add:
                    errors.append(f"expected image number was incremented")
                validation.get_image_attributes(img_number_after_add)
                position = img_number_after_add - 1
                get_base64_before_upd = validation.get_img_base64()
                validation.edit_img(True)
                if not validation.img_saved():
                    errors.append(f"save image button is still displayed")
                # added pause:
                time.sleep(2)
                record_from_db_3 = find_docs_in_collection(db_params.TESTING_HALINA, {
                    db_params.RECORD_ID: doc_id})
                img_after_edit = record_from_db_3[db_params.CURRENT_STATE][db_params.IMAGE_LINKS][current_category_name]
                audit_session_after_edit = record_from_db_3[db_params.AUDIT_SESSIONS]
                audit_diff_after_edit = [x for x in audit_session_after_edit if x not in audit_session_after_add]

                if len(audit_diff_after_edit) != 1:
                    print(f"audit diff after edit: {len(audit_session_after_edit)}")
                    errors.append(f"expected number of audits after edit +1, got {len(audit_diff_after_edit)}")

                # check diff:
                audit_log_after_edit = audit_diff_after_edit[0]
                edited_img = audit_log_after_edit[db_params.AUDIT_VALUE_ARRAY][0]
                data[db_params.TYPE] = db_params.EDIT
                data["position"] = position
                data["changed"] = img_after_add[position]
                data[db_params.OLD_VALUE] = edited_img[db_params.OLD_VALUE]
                data[db_params.NEW_VALUE] = edited_img[db_params.NEW_VALUE]
                data["was_data"] = img_after_add
                data["is_data"] = img_after_edit
                data[db_params.AUDITED_COMMENT] = edited_img[db_params.AUDITED_COMMENT]
                data[db_params.AUDIT_FIELD_NAME] = edited_img[db_params.AUDIT_FIELD_NAME]
                errors = handle_data_changes(data, errors)
                if audit_log_after_edit["RegisteredUserEmail"] != os.getenv("DV_USER"):
                    errors.append(
                        f"data after edit was changed by {os.getenv('DV_USER')} but received in AuditSession for the field RegisteredUserEmail: {audit_log_after_edit['RegisteredUserEmail']}")
                if not validation.check_img_base64_changed(get_base64_before_upd):
                    errors.append(f"expected image base64 was changed")
                get_base64_after_upd = validation.get_img_base64()
                # edit-cancel check:
                validation.edit_img(False)
                record_from_db_4 = find_docs_in_collection(db_params.TESTING_HALINA, {
                    db_params.RECORD_ID: doc_id})
                if record_from_db_4 != record_from_db_3:
                    errors.append(f"document was changed, while edit was cancelled")
                img_path = f"""{str(Path(__file__).parents[2])}/params/files/{params.IMG_2}"""
                validation.file_upload(img_path)
                if not validation.check_img_base64_changed(get_base64_before_upd):
                    errors.append(f"expected image base64 was changed after replacement")
                time.sleep(5)
                record_from_db_5 = find_docs_in_collection(db_params.TESTING_HALINA, {
                    db_params.RECORD_ID: doc_id})
                img_after_replace = record_from_db_5[db_params.CURRENT_STATE][db_params.IMAGE_LINKS][
                    current_category_name]
                audit_session_after_replace = record_from_db_5[db_params.AUDIT_SESSIONS]
                audit_after_replace_diff = [x for x in audit_session_after_replace if x not in audit_session_after_edit]

                if len(audit_after_replace_diff) != 1:
                    errors.append(f"expected number of audits after replace +1, got {len(audit_after_replace_diff)}")
                # check diff:
                audit_log_after_replace = audit_after_replace_diff[0]
                replaced_img = audit_log_after_replace[db_params.AUDIT_VALUE_ARRAY][0]
                data[db_params.TYPE] = db_params.REPLACE
                data["changed"] = img_after_replace[position]
                data["old_img_link"] = img_after_edit[position]
                data[db_params.OLD_VALUE] = replaced_img[db_params.OLD_VALUE]
                data[db_params.NEW_VALUE] = replaced_img[db_params.NEW_VALUE]
                data[db_params.AUDITED_COMMENT] = replaced_img[db_params.AUDITED_COMMENT]
                data[db_params.AUDIT_FIELD_NAME] = replaced_img[db_params.AUDIT_FIELD_NAME]
                data["was_data"] = img_after_edit
                data["is_data"] = img_after_replace
                errors = handle_data_changes(data, errors)
                if audit_log_after_replace["RegisteredUserEmail"] != os.getenv("DV_USER"):
                    errors.append(
                        f"data after replace was changed by {os.getenv('DV_USER')} but received in AuditSession for the field RegisteredUserEmail: {audit_log_after_replace['RegisteredUserEmail']}")
                if not validation.remove_img(True):
                    errors.append(f"expected tab was removed when the image was removed")
                record_from_db_6 = find_docs_in_collection(db_params.TESTING_HALINA, {
                    db_params.RECORD_ID: doc_id})
                # set record after changes as primary state:
                record_from_db_1 = record_from_db_6
                img_after_remove = record_from_db_6[db_params.CURRENT_STATE][db_params.IMAGE_LINKS][
                    current_category_name]
                audit_session_after_remove = record_from_db_6[db_params.AUDIT_SESSIONS]
                audit_diff_after_remove = [x for x in audit_session_after_remove if
                                           x not in audit_session_after_replace]
                if len(audit_diff_after_remove) != 1:
                    errors.append(f"expected number of audits after removal +1, got {len(audit_after_replace_diff)}")
                # check diff:
                audit_log_after_remove = audit_diff_after_remove[0]
                removed_img = audit_log_after_remove[db_params.AUDIT_VALUE_ARRAY][0]
                data[db_params.TYPE] = db_params.REMOVE
                data["changed"] = img_after_replace[position]
                data[db_params.OLD_VALUE] = removed_img[db_params.OLD_VALUE]
                data[db_params.NEW_VALUE] = removed_img[db_params.NEW_VALUE]
                data[db_params.AUDITED_COMMENT] = removed_img[db_params.AUDITED_COMMENT]
                data[db_params.AUDIT_FIELD_NAME] = removed_img[db_params.AUDIT_FIELD_NAME]
                data["was_data"] = img_after_replace
                data["is_data"] = img_after_remove
                errors = handle_data_changes(data, errors)
                if audit_log_after_remove["RegisteredUserEmail"] != os.getenv("DV_USER"):
                    errors.append(
                        f"data after remove was changed by {os.getenv('DV_USER')} but received in AuditSession for the field RegisteredUserEmail: {audit_log_after_remove['RegisteredUserEmail']}")
        assert errors == []

    @doc_it()
    @pytest.mark.download_non_image_files
    @pytest.mark.parametrize("collection_name", [db_params.TESTING_HALINA])
    def test_12633_download_non_image_files(self, browser, hub, collection_name, gen_data):
        """
        The user uploads non-image file.
        The user checks that download btn is displayed.
        For non-hub tests check is done that file is downloaded.
        In the end of the test the user removes the file.
        :param browser:
        :param hub:
        :return:
        """
        errors = []
        doc_id = 3
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.img_btn_handle("add", 2)
        if not validation.img_btn_handle("load", 1):
            errors.append(f"expected load btn to be invisible")
        file_path = f"""{str(Path(__file__).parents[2])}/params/files/{params.FILE_1}"""
        validation.upload_img(True, file_path)
        downloaded_file = f"""{str(Path(__file__).parents[3])}/{params.FILE_1}"""
        if not validation.download_file(downloaded_file, hub):
            errors.append(f"file {params.FILE_1} was not downloaded")
        if not validation.remove_img(True):
            errors.append("image was not removed")
        assert errors == []

    @doc_it()
    @pytest.mark.check_parametrize_buttons
    def test_12576_parametrized_btns(self, browser):
        """
        The user adds to the config parameter that allows to name and
        manage image btns.
        :return:
        """
        errors = []
        collection_name = db_params.TESTING_HALINA
        doc_id = 3
        load_message = "load"
        delete_message = "delete"
        remove_message = "remove"
        edit_message = "edit"
        upd_conf = {"image_edit_options": {
            "load_button": {
                "visible": False,
                "warning": load_message
            },
            "replace_button": {
                "visible": False,
                "warning": delete_message
            },
            "remove_button": {
                "visible": False,
                "warning": remove_message
            },
            "edit_button": {
                "visible": False,
                "warning": edit_message
            }
        }}
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name}, {"$set": upd_conf})
        login_and_go_to_url(browser, collection_name, doc_id)
        validation = ValidationPage(browser)
        validation.remove_fixed_elements()
        if not validation.img_btn_handle("edit", 0):
            errors.append(f"expected edit btn to be invisible")
        if not validation.img_btn_handle("remove", 0):
            errors.append(f"expected remove btn to be invisible")
        if not validation.img_btn_handle("replace", 0):
            errors.append(f"expected replace btn to be invisible")
        upd_conf["image_edit_options"]["replace_button"]["visible"] = True
        upd_conf["image_edit_options"]["remove_button"]["visible"] = True
        upd_conf["image_edit_options"]["edit_button"]["visible"] = True
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name}, {"$set": upd_conf})
        browser.refresh()
        if not validation.img_btn_handle("edit", 1):
            errors.append(f"expected edit btn to be visible")
        if not validation.img_btn_handle("remove", 1):
            errors.append(f"expected remove btn to be visible")
        if not validation.img_btn_handle("replace", 1):
            errors.append(f"expected replace btn to be visible")
        validation.img_btn_handle("edit", 2)
        alert = validation.get_alert_text()
        if edit_message not in alert:
            errors.append(f"expected {edit_message} to be in alert text")
        validation.confirm_alert()
        if not validation.img_btn_handle("save", 1):
            errors.append("expected save button to be visible")
        if not validation.img_btn_handle("cancel", 2):
            errors.append("expected cancel button to be non visible after click")
        validation.img_btn_handle("add", 2)
        if not validation.img_btn_handle("load", 0):
            errors.append(f"expected load btn to be invisible")

        upd_conf["image_edit_options"]["load_button"]["visible"] = True
        upd_conf["image_edit_options"]["edit_button"]["warning"] = None
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name}, {"$set": upd_conf})
        browser.refresh()
        if not validation.img_btn_handle("edit", 1):
            errors.append("expected edit btn to be visible")
        validation.img_btn_handle("edit", 2)
        validation.img_btn_handle("cancel", 2)
        validation.img_btn_handle("add", 2)
        if not validation.img_btn_handle("load", 1):
            errors.append(f"expected load btn to be visible")
        assert errors == []

    @doc_it()
    @pytest.mark.upload_file_with_s3_config
    @pytest.mark.config_update
    @pytest.mark.collection_not_to_update
    @pytest.mark.parametrize("collection_name", [db_params.TEST_FX_FEES_0_3])
    def test_14806_upload_file_with_s3_config(self, browser, collection_name, gen_data):
        """
        The user presets config for s3 usage.
        The user  uploads file and checks that file is uploaded
        with config path
        :param browser:
        :return:
        """
        errors = []
        doc_id = 1
        primary_config = find_docs_in_collection(db_params.CONFIGURATION,
                                                 {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        image_upload_destination = {
            "s3_bucket_name": "fxci.manual-data-collection-staging",
            "s3_folder_name": "collections/fee/${RecordId}/images"
        }
        image_field_name = Faker().name()
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {db_params.IMAGE_UPLOAD_DESTINATION: image_upload_destination,
                               db_params.IMAGE_FIELD_NAMES: [image_field_name]}})

        login_and_go_to_url(browser, collection_name, doc_id)
        page = ValidationPage(browser)
        img_path = f"""{str(Path(__file__).parents[2])}/params/files/{params.IMG_2}"""
        page.get_img_from_category(image_field_name)
        page.file_upload(img_path)
        if not page.img_btn_handle("load", 1):
            errors.append(f"expected load btn to be invisible")
        time.sleep(4)
        upd_doc = find_docs_in_collection(collection_name, {db_params.RECORD_ID: doc_id})
        path_to_be = f"{image_upload_destination['s3_bucket_name']}/collections/fee/{upd_doc[db_params.RECORD_ID]}/images"
        if path_to_be not in upd_doc[db_params.CURRENT_STATE][db_params.IMAGE_LINKS][image_field_name][0]:
            errors.append(
                f"expected path to contain {path_to_be}, got {upd_doc[db_params.CURRENT_STATE][db_params.IMAGE_LINKS][image_field_name][0]}")
        update_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name},
                     {"$set": {db_params.IMAGE_UPLOAD_DESTINATION: primary_config[db_params.IMAGE_UPLOAD_DESTINATION],
                               db_params.IMAGE_FIELD_NAMES: primary_config[db_params.IMAGE_FIELD_NAMES]}})
        assert errors == []

import json
import os

import requests

from pages.login.login_page_actions import LoginPage
from pages.search.search_page_actions import SearchPage
from params import texts, db_params, params
from params import urls
from params.urls import ADMIN


def login_to_app(browser, user=None, pswd=None, admin=False):
    go_to_login_page(browser, admin)
    dv_main_page = LoginPage(browser)
    if user is None:
        user = os.getenv("DV_USER")
    if pswd is None:
        pswd = os.getenv("DV_PSWD")
    dv_main_page.enter_login_pswd(user, pswd)
    dv_main_page.submit_login_form()
    if not admin:
        dv_main_page.check_url_contains(urls.DASHBOARD)


def go_to_login_page(browser, admin=False):
    dv_main_page = LoginPage(browser)
    if admin:
        dv_main_page.go_to_url(admin=admin, url=urls.ADMIN_LOGIN)
    else:
        dv_main_page.go_to_url(admin=admin)
        dv_main_page.go_to_login_form()


def register_new_user(browser, firstname=None, lastname=None, email=None, pswd=None):
    go_to_login_page(browser)
    page = LoginPage(browser)
    page.go_to_register_form()
    page.fill_register_from(firstname, lastname, email, pswd)
    page.submit_login_form()


def set_filters(browser, fields, collection_name=None, init_search_by_click=True):
    search_page = SearchPage(browser)
    if collection_name:
        search_page.select_collection(collection_name)
    field_input_index = 0
    field_dropdown_index = 0
    for i in range(len(fields)):
        if fields[i]:
            if params.SECOND_VALUE not in fields[i]:
                fields[i][params.SECOND_VALUE] = None
            if params.IS_INPUT not in fields[i]:
                fields[i][params.IS_INPUT] = True
            if params.OPERATION not in fields[i]:
                fields[i][params.OPERATION] = texts.EQUAL_TO
            if db_params.NAME not in fields[i]:
                fields[i][db_params.NAME] = db_params.RECORD_ID
            if params.VALUE not in fields[i]:
                fields[i][params.VALUE] = None
            if fields[i][params.IS_INPUT]:
                index = field_input_index
            else:
                index = field_dropdown_index
            search_page.set_search_filters(fields[i][db_params.NAME], fields[i][params.VALUE],
                                           fields[i][params.OPERATION], fields[i][params.SECOND_VALUE], i,
                                           fields[i][params.IS_INPUT], index)
            if len(fields) > 1 and i != len(fields) - 1:
                search_page.add_search_param(i)
            if fields[i][params.OPERATION] == texts.BETWEEN and fields[i][params.IS_INPUT] is True:
                field_input_index += 2
            elif fields[i][params.IS_INPUT] is True:
                field_input_index += 1
            elif fields[i][params.IS_INPUT] is False:
                field_dropdown_index += 1
    if init_search_by_click is True:
        search_page.search_init()
    elif init_search_by_click is False:
        search_page.search_init_by_enter_btn()


# todo: add logic for selection, now first row is selected
def select_record_by_cell_key_value(browser, record_number, url, field_name=db_params.RECORD_ID):
    dashboard = SearchPage(browser)
    dashboard.select_row_by_id(record_number, field_name)
    # new tab is open, proceed in it:
    dashboard.switch_to_tab(1, 1)
    dashboard.check_url_contains(f"{url}/{record_number}")


def login_and_search_record_by_record_id(browser, collection_name, doc_id):
    login_to_app(browser)
    fields = [{params.VALUE: doc_id}]
    set_filters(browser, fields, collection_name)


def set_jwt_token(browser):
    page = LoginPage(browser)
    page.go_to_url()
    host = os.getenv("HOST")
    if "400" in host:
        host = host[:host.rfind(":")] + ":4001"
    else:
        host += ":4000"
    resp = requests.post(f"""{host}/auth/login""",
                         data={"email": os.getenv("DV_USER"), "password": os.getenv("DV_PSWD")})
    browser.execute_script(f"""window.localStorage.setItem('jwtToken', '{json.loads(resp.text)["token"]}')""")


def login_and_go_to_url(browser, collection_name, doc_id=None, is_admin=False):
    page = LoginPage(browser)
    set_jwt_token(browser)
    if doc_id is not None:
        page.go_to_url(f"/detail/{collection_name}/{doc_id}")
    if is_admin:
        page.go_to_url(ADMIN)

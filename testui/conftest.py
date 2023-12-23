import inspect
import json
import logging
import os
import pathlib
import shutil
import time
from datetime import datetime, timedelta
from functools import wraps
from pathlib import Path

import logstash
import pytest
from _pytest.fixtures import FixtureLookupError
from dotenv import load_dotenv
from selenium import webdriver
from selenium.common.exceptions import SessionNotCreatedException
from selenium.webdriver import DesiredCapabilities
from selenium.webdriver.chrome.options import Options

from dbutil.db_utils import find_docs_in_collection
from dbutil.generate_test_data import generate_test_data, record_regenerate, gen_test_data, config_regenerate
from params import db_params, params

load_dotenv()


def pytest_addoption(parser):
    parser.addoption('--browser_name', action='store', default="chrome",
                     help="Choose browser: chrome or firefox")
    parser.addoption('--hub', action='store', default=0,
                     help="Set up hub or driver")
    parser.addoption("--env", action="store", default=".env", help="Path to env file, default .env")
    parser.addoption("--headless", action="store", default=False, help="Is headless driver?")
    parser.addoption("--admin", action="store", default=0, help="Define if admin panel: 1 - yes, 0 - no")
    parser.addoption("--part", action="store", default=0, help="Define if collection part to be set: 1 - yes, 0 - no")
    parser.addoption("--admin_collection", action="store",
                     default="global_and_local_updates_testing_with_exclusions_for_app", help="Set up admin collection")
    parser.addoption("--rmv_doc", action="store", default=1,
                     help="Remove previous doc version")
    parser.addoption("--doc_folder", action="store", default=1,
                     help="Path to doc")


@pytest.fixture(scope="session")
def get_doc_folder(request):
    return request.config.getoption("doc_folder")


@pytest.fixture(scope="function")
def get_fields_from_collection(request):
    collection_name = request.config.getoption("--admin_collection")
    all_docs = find_docs_in_collection(db_params.SCHEMA_OVERVIEWS, {db_params.COLLECTION_NAME: collection_name})
    all_fields = [x[db_params.NAME] for x in all_docs["fields"]]
    cur_state_fields = [x.replace(f"{db_params.CURRENT_STATE}.", "") for x in all_fields if
                        f"{db_params.CURRENT_STATE}." in x]
    record_id_field = [x for x in all_fields if x == db_params.RECORD_ID]
    audit_fields = [x.replace(f"{db_params.AUDIT_STATE}.", "") for x in all_fields if f"{db_params.AUDIT_STATE}." in x]
    sub_fields = [x for x in cur_state_fields if "." in x]
    with_nested_fields = set([x[:x.find(f".")] for x in sub_fields])
    removed_brackets_fields = [x.replace(".[]", "") for x in sub_fields]
    sub_fields_only = set([x for x in removed_brackets_fields if x not in with_nested_fields])
    dict_list = {}
    for with_nested in with_nested_fields:
        dict_list[with_nested] = [x.replace(f"{with_nested}.", "") for x in sub_fields_only if with_nested in x]
    cur_hof_fields = [x for x in cur_state_fields if x not in with_nested_fields and "." not in x]
    return {params.AUDITED_FIELDS: audit_fields, params.NON_DICT_CUR_STATE_FIELDS: cur_hof_fields + record_id_field,
            params.DICT_LISTS: dict_list, params.ALL_SUB_ITEMS: sub_fields_only}


@pytest.fixture(scope="function")
def hub(request):
    return request.config.getoption("hub")


@pytest.fixture(scope="session", autouse=False)
def remove_files(request):
    if int(request.config.getoption("rmv_doc")) == 1:
        cur_path = os.path.dirname(os.path.realpath(__file__))
        for f in ["test_files.md", "vars.md", "test_doc_prev.md"]:
            file_path = os.path.join(cur_path, f)
            if os.path.exists(file_path):
                os.remove(file_path)
        if os.path.exists(os.path.join(cur_path, "test_doc.md")):
            os.rename(os.path.join(cur_path, "test_doc.md"), os.path.join(cur_path, "test_doc_prev.md"))
        for i in ["test_files.md", "vars.md", "test_doc.md"]:
            f = open(os.path.join(cur_path, i), "x")
            f.close()
    dir_path = Path(__file__).parents[1]
    if Path(f"{dir_path}/reports").exists() and Path(f"{dir_path}/reports").is_dir():
        shutil.rmtree(f"{dir_path}/reports")


@pytest.fixture(scope="function")
def browser(request):
    browser_name = request.config.getoption("browser_name")
    hub = request.config.getoption("hub")
    download_path = f"""{str(Path(__file__).parents[1])}"""
    if browser_name == "chrome":
        capabilities = DesiredCapabilities.CHROME
        capabilities["goog:loggingPrefs"] = {"performance": "ALL"}
        capabilities["browser_name"] = browser_name

    if int(hub) == 1:
        if 'HUB_HOST' in os.environ:
            host = os.getenv('HUB_HOST')
        else:
            host = "localhost"
        print(host)
        start_time = datetime.now()
        processed_time = start_time
        while processed_time <= start_time + timedelta(minutes=30):
            try:
                browser = webdriver.Remote(
                    command_executor=f"http://{host}:4444/wd/hub",
                    desired_capabilities=capabilities
                )
                break
            except SessionNotCreatedException:
                time.sleep(30)
                processed_time = datetime.now()
    else:
        headless = request.config.getoption("--headless")
        if browser_name == "chrome":
            print("\nstart chrome browser for test..")
            # options.add_argument("--start-maximized")
            chrome_options = Options()
            options = webdriver.ChromeOptions()

            prefs = {
                "download.default_directory": download_path,
                "download.prompt_for_download": False,
                "download.directory_upgrade": True
            }

            options.add_experimental_option('prefs', prefs)
            options.add_argument("no-sandbox")
            options.add_argument("--disable-gpu")
            options.add_argument("--disable-dev-shm-usage")
            if headless == "true":
                # Set headless flag to true
                chrome_options.add_argument("--headless")
            browser = webdriver.Chrome(options=options, desired_capabilities=capabilities)
        elif browser_name == "firefox":
            print("\nstart firefox browser for test..")
            options = webdriver.FirefoxOptions()
            if headless == "true":
                # Set headless flag to true
                options.add_argument("headless")
            browser = webdriver.Firefox(options=options)
    browser.set_window_size(1900, 1000)
    tests_failed_before_module = request.session.testsfailed
    yield browser
    print("\nquit browser..")
    tests_failed_during_module = request.session.testsfailed - tests_failed_before_module
    try:
        if tests_failed_during_module:
            pathlib.Path(f"{download_path}/reports").mkdir(parents=True, exist_ok=True)
            browser.get_screenshot_as_file(f"{download_path}/reports/{str(request.node)}.png")
        browser.quit()
    except ValueError:
        print("Session was already closed")


@pytest.fixture(scope="session")
def env(request):
    return request.config.getoption("env")


@pytest.fixture(scope="session")
def admin(request):
    return request.config.getoption("admin")


@pytest.fixture(scope="session", autouse=False)
def recreate_test_collections():
    generate_test_data()


def doc_it(*func_args):
    def inner_function(function=None):
        @wraps(function)
        def wrapper(*args, **kwargs):
            cur_path = os.path.dirname(os.path.realpath(__file__))
            if func_args:
                print(f"Arguments passed to decorator {func_args}")
            with open(os.path.join(cur_path, "vars.md"), "r+") as var_f, open(
                    os.path.join(cur_path, "test_doc.md"), "a") as doc_f, open(
                os.path.join(cur_path, "test_files.md"),
                "r+") as name_f:
                try:
                    last_line_vars = var_f.read().splitlines()[-1]
                except IndexError:
                    last_line_vars = ""
                filename_path = os.path.abspath(inspect.getfile(function))
                filename = filename_path[filename_path.rfind("/") + 1:]
                try:
                    last_line_names = name_f.read().splitlines()[-1]
                except IndexError:
                    last_line_names = False
                if last_line_names and filename not in last_line_names:
                    doc_f.write(f"## {filename}\n")
                elif not last_line_names:
                    doc_f.write("# Test groups\n")
                    doc_f.write(f"## {filename}\n")
                    name_f.write(f"{filename}\n")
                if function.__name__ not in last_line_vars:
                    doc_f.write(f"### Test name\n")
                    doc_f.write(f"{function.__name__}\n")
                    parametrized = [x for x in getattr(function, "pytestmark", []) if x.name == "parametrize"]
                    if parametrized:
                        doc_f.write("#### Params\n")
                        for p in parametrized:
                            doc_f.write(f"-{p.args[0]}\n")
                            dicts = [x for x in p.args[1] if type(x) == dict]
                            if dicts:
                                value_to_write = []
                                for d in dicts:
                                    value_to_write.append(json.dumps(d, indent=4))
                                value_to_write = f"[{','.join(value_to_write)}]"
                            else:
                                value_to_write = p.args[1]
                            doc_f.write(f"\n~~~\n")
                            doc_f.write(f"{value_to_write}\n")
                            doc_f.write(f"~~~\n")
                    doc_f.write("#### Description\n")
                    test_doc = function.__doc__
                    if test_doc:
                        desc = test_doc.split("\n")
                    else:
                        desc = ""
                    for d in desc:
                        doc_f.write(f"\t{d}\n")
                    var_f.write(f"{function.__name__}\n")
            return function(*args, **kwargs)

        return wrapper

    return inner_function


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport():
    outcome = yield
    rep = outcome.get_result()
    host = os.getenv("ELK_URL")
    port = os.getenv("ELK_PORT")
    msg = {
        "passed": rep.passed,
        "test_duration": rep.duration,
        "source": "test_app.datavalidation"
    }
    if rep.failed:
        msg["test_error"] = rep.longrepr.reprcrash.message
    if rep.when == 'call':
        msg["markers"] = json.dumps(rep.keywords)
        test_logger = logging.getLogger('python-logstash-logger')
        test_logger.setLevel(logging.INFO)
        test_logger.addHandler(logstash.TCPLogstashHandler(host, port, version=1))
        test_logger.info('test passed', extra=msg)


@pytest.fixture(scope="function")
def gen_data(request):
    try:
        record_id = request.getfixturevalue('record_id')
    except FixtureLookupError:
        record_id = None
    collection_name = request.getfixturevalue("collection_name")
    yield request
    config_update = True if "config_update" in [m.name for m in request.node.iter_markers()] else False
    coll_to_upd = False if "collection_not_to_update" in [m.name for m in request.node.iter_markers()] else True
    if record_id is None and coll_to_upd:
        gen_test_data(collection_name)
    elif record_id is not None:
        record_regenerate(record_id, collection_name)
    if config_update:
        config_regenerate(collection_name)

import filecmp
import json
import os
from pathlib import Path

import requests


def test_doc_to_wiki(get_doc_folder):
    """
    This script aimed to update documentation in wiki in case of any doc changes.
    :return:
    """
    errors = []
    cur_path = os.path.dirname(os.path.realpath(__file__))
    print(Path(cur_path).parents[1])
    if int(get_doc_folder) == 1:
        folder_path = ""
    else:
        folder_path = Path(cur_path).parents[1]
    cur_doc = os.path.join(folder_path, "test_doc.md")
    prev_doc = os.path.join(folder_path, "test_doc_prev.md")
    if not filecmp.cmp(prev_doc, cur_doc):
        with open(cur_doc, "r") as cur_doc:
            url = f"{os.getenv('REDMINE_HOST')}.json"
            desc = ""
            doc = cur_doc.read()
            lines = cur_doc.readlines()
            for line in lines:
                desc += line[:line.rfind("\n")] + "\\\n"
            payload = {
                "wiki_page": {
                    "text": f"{doc}"
                }
            }
            headers = {
                'Content-Type': 'application/json'
            }
            response = requests.request("PUT", url, data=json.dumps(payload), headers=headers,
                                        auth=(os.getenv("REDMINE_USER"), os.getenv("REDMINE_PSWD")))
            if response.status_code != 200:
                errors.append("expected status code to be 200")
    assert errors == []

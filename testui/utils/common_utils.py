import json
from datetime import datetime

import networkx as nx

from params import db_params


def get_substring(string, from_char, to_char):
    return string[string.index(from_char) + 1:string.index(to_char)]


def check_depth(updated_logics, updated_fields_list):
    res = {"errors": [], "results": None}
    g = nx.DiGraph()
    for l in updated_logics:
        for item in l["dependency_fields"]:
            g.add_node(item)
            g.add_edge(item, l["updated_field"])
    cycles = []
    for cycle in nx.simple_cycles(g):
        # if any field from update is in cycle
        cycles.append(cycle)
    field_depth = {}
    cycles = set([item for sublist in cycles for item in sublist])
    if cycles:
        res["errors"].append(ValueError)
    for f in g:
        all_deps = set()
        for depth, (node, edges) in enumerate(nx.bfs_successors(g, f)):
            all_deps.update(set(edges))
        field_depth[f] = {"dep": all_deps, "cycle": None}
        cycle_intersection = [x for x in all_deps if x in cycles]
        if cycle_intersection:
            field_depth[f]["cycle"] = RecursionError

    dependent_fields = [field_depth[k]["dep"] for k in field_depth.keys() if k in updated_fields_list]
    res["results"] = set([item for sublist in dependent_fields for item in sublist])
    errors = set([field_depth[k]["cycle"] for k in field_depth.keys() if k in updated_fields_list])
    for e in errors:
        res["errors"].append(e)
    return res


def check_date_format(str):
    if datetime.strptime(str, '%Y-%m-%d') is not ValueError:
        return datetime.combine(datetime.strptime(str, '%Y-%m-%d'), datetime.min.time())
    elif datetime.strptime(str, '%Y-%m-%d %H:%M:%S') is not ValueError:
        return datetime.strptime(str, '%Y-%m-%d %H:%M:%S')


def convert24(str1):
    # Checking if last two elements of time
    # is AM and first two elements are 12
    if str1[-2:] == "AM" and str1[:2] == "12":
        return "0" + str1[2:-3]

        # remove the AM
    elif str1[-2:] == "AM":
        return str1[:-3]

        # Checking if last two elements of time
    # is PM and first two elements are 12
    elif str1[-2:] == "PM" and str1[:2] == "12":
        return str1[:-3]

    else:
        # add 12 to hours and remove PM
        return str(int(str1[:str1.find(":")]) + 12) + str1[str1.find(":"):str1.rfind(" ")]


def is_date(date_text):
    try:
        datetime.strptime(date_text, '%Y-%m-%d')
        return True
    except ValueError:
        return False


def compare_sums(updated, primary, incr):
    errors = []
    if updated != primary + incr:
        errors.append(
            f"before update: {primary}, after update: {updated}, expected number of upd: {incr}")
    return errors


def get_name_from_array(fields, name):
    return [x for x in fields if x[db_params.NAME] == name][0][db_params.NEW_VALUE]


def margins_calc(ib_rate, fx_rate):
    return (ib_rate - fx_rate) / ib_rate * 100


def full_cost_calc(ib_rate, fx_rate, fee, amount):
    return ((ib_rate - fx_rate) / ib_rate * 100.0) + (fee / amount)


def convert_bool_to_str(val, upper=True):
    if val is True:
        return "True" if upper else "true"
    elif val is False:
        return "False" if upper else "false"
    elif val is None:
        return "null"
    else:
        return val


def str_to_num(s):
    try:
        return int(s)
    except ValueError:
        return s


def is_num(s):
    try:
        return int(s)
    except ValueError:
        return ValueError


def api_call(logs, return_post_data=True):
    messages = [json.loads(entry["message"])["message"] for entry in logs]
    to_be_received = [x for x in messages if x["method"] == "Network.requestWillBeSent"]
    sent_req = [x["params"] for x in to_be_received if
                "params" in x and "hasUserGesture" in x["params"] and x["params"]["hasUserGesture"]]
    url = ""
    post_data = ""
    if return_post_data:
        if sent_req[0] and "request" in sent_req[0]:
            if "url" in sent_req[0]["request"]:
                url = sent_req[0]["request"]["url"]
            if "postData" in sent_req[0]["request"]:
                post_data = json.loads(sent_req[0]["request"]["postData"])

    return {"url": url, "post_data": post_data, "api_reqs": sent_req}
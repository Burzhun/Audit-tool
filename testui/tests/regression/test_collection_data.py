import os

import pytest

from conftest import doc_it
from dbutil.db_utils import find_docs_in_collection
from params.db_params import CURRENT_STATE, AMOUNTS_AND_RATES, DATETIME_COLLECTED_UTC, FX_RATE, CURRENCY_FROM, \
    CURRENCY_TO, INTERBANK_RATE, RECORD_ID, PROVIDER_NAME


@pytest.mark.usefixtures("remove_files")
@pytest.mark.check_stage_prod_collection
@doc_it()
def test_check_stage_prod_collection():
    """
    Test checks changes between stage and prod collections
    """
    errors = []
    collection_name = "FxPricing"
    stage_docs = find_docs_in_collection(collection_name, {"CurrentState.data_collection_id": 165}, False)
    prod_docs = find_docs_in_collection(collection_name, {"CurrentState.data_collection_id": 165}, False,
                                        os.getenv("OTHER_DB_CREDS"))
    if len(stage_docs) != len(prod_docs):
        errors.append("******************\n")
        errors.append(f"expected lists to be the same, got {len(stage_docs)} prod {len(prod_docs)}\n")
    matched_docs = 0
    for stage_doc in stage_docs:
        for prod_doc in prod_docs:
            if stage_doc[CURRENT_STATE][CURRENCY_FROM] == prod_doc[CURRENT_STATE][CURRENCY_FROM] and \
                    stage_doc[CURRENT_STATE][CURRENCY_TO] == prod_doc[CURRENT_STATE][CURRENCY_TO] and \
                    stage_doc[CURRENT_STATE]["client_type"] == prod_doc[CURRENT_STATE]["client_type"] and \
                    stage_doc[CURRENT_STATE][
                        PROVIDER_NAME] == prod_doc[CURRENT_STATE][PROVIDER_NAME] \
                    and stage_doc[CURRENT_STATE]["unique_id"] == prod_doc[CURRENT_STATE]["unique_id"]:
                matched_docs += 1
                amounts_list_stage = stage_doc[CURRENT_STATE][AMOUNTS_AND_RATES]
                amounts_list_prod = prod_doc[CURRENT_STATE][AMOUNTS_AND_RATES]
                stage_amounts_from = [float(x["amount_from"]) for x in amounts_list_stage]
                prod_amounts_from = [float(x["amount_from"]) for x in amounts_list_prod]
                if sorted(stage_amounts_from) != sorted(prod_amounts_from):
                    errors.append("******************\n")
                    errors.append(
                        f"expected amounts from to be equal, got {stage_amounts_from} for stage and {prod_amounts_from} for prod for doc stage recordId={stage_doc[RECORD_ID]} and prod recordId={prod_doc[RECORD_ID]}\n")
                for am in stage_amounts_from:
                    stage_data = [x for x in amounts_list_stage if float(x["amount_from"]) == float(am)]
                    prod_data = [x for x in amounts_list_prod if float(x["amount_from"]) == float(am)]
                    if stage_data and prod_data:
                        if stage_data[0][FX_RATE] != prod_data[0][FX_RATE]:
                            errors.append("******************\n")
                            errors.append(
                                f"expected FX_RATE for {am} to be equal, got {stage_data[0][FX_RATE]} for stage and {prod_data[0][FX_RATE]} for prod for doc stage recordId={stage_doc[RECORD_ID]} and prod recordId={prod_doc[RECORD_ID]}\n")
                        if stage_data[0][INTERBANK_RATE] != prod_data[0][INTERBANK_RATE]:
                            errors.append("******************\n")
                            errors.append(
                                f"expected INTERBANK_RATE for {am} to be equal, got {stage_data[0][INTERBANK_RATE]} for stage and {prod_data[0][INTERBANK_RATE]} for prod for doc stage recordId={stage_doc[RECORD_ID]} and prod recordId={prod_doc[RECORD_ID]}\n")

                        if stage_data[0][DATETIME_COLLECTED_UTC] != prod_data[0][DATETIME_COLLECTED_UTC]:
                            errors.append("******************\n")
                            errors.append(
                                f"expected DATETIME_COLLECTED_UTC for {am} to be equal, got {stage_data[0][DATETIME_COLLECTED_UTC]} for stage and {prod_data[0][DATETIME_COLLECTED_UTC]} for prod for doc stage recordId={stage_doc[RECORD_ID]} and prod recordId={prod_doc[RECORD_ID]}\n")
    if matched_docs < min([len(stage_docs), len(prod_docs)]):
        errors.append("******************\n")
        errors.append(
            f"expected matched doc length to be {min([len(stage_docs), len(prod_docs)])} got {matched_docs}\n")

    log_file = open("log.txt", "w")
    for e in errors:
        log_file.write(e)
    log_file.close()

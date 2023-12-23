import datetime
import random

from bson import ObjectId

from dbutil.db_utils import find_docs_in_collection, delete_mongo, insert_mongo, \
    copy_collection_to_another_mongo
from params import db_params


def create_random_docs_and_config(collection_name):
    currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD']
    researchers = ['Mat', 'Valentina', 'Ian', 'Andrej', 'Valentina']
    populations = [327000000, 83000000, 66000000, 126000000, 38000000, 24600000]
    areas = [9834000, 357022, 242495, 377915, 9985000, 7692000]
    lakes = [342, 533, 234, 454, 24, 242]

    amounts = [1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000]
    ib_rates = [
        (0.3273, [0.31235, 0.315674, 0.3084675, 0.309723]),
        (12.5783, [12.4, 12.3, 12.2, 12.1, 12.0]),
        (45.236713, [45.22, 45.19, 45.17, 45.05, 44.78]),
        (0.94738, [0.944, 0.932, 0.929, 0.909]),
        (1.18934, [1.181, 1.1723, 1.1719, 1.16948, 1.159999])
    ]
    fees = [10 * i for i in range(10)]

    banks = [
        ('Barclays Bank Plc', '213149', 'GBR'),
        ('Lloyds Bank', '324554', 'GBR'),
        ('Santander', '244713', 'GBR'),
        ('HSBC', '943857', 'GBR'),
        ('TSB', '394803', 'GBR'),
        ('RBS', '309283', 'GBR'),
        ('Natwest', '447574', 'GBR'),
        ('Wells Fargo', '394208', 'USA'),
        ('Fifth Third', '048734', 'USA'),
        ('Morgan Stanley', '338920', 'USA'),
        ('Bank of Queensland', '2739067', 'AUS'),
        ('Bank of Montreal', '349539', 'CAN')
    ]
    gdp_growth = [-1.3455, 3.456, -0.445, 3.567, 1.234, -2.466]
    collected_dates = [[
        ((datetime.datetime(2020, 4, 27, 11, 34, 23) - datetime.timedelta(
            seconds=(j * (86400 * 31)) + random.randint(0, 86400 * 2)))).isoformat().split('T')[0] for i in range(8)
    ] for j in range(12)]

    qa_statuses = [
        'approved', 'approved', 'approved', 'approved', 'approved', 'rejected', 'rejected'
    ]
    official_languages = ['English', 'German', 'English', 'Japanese', 'French', 'English']
    leaders = ['Donald Trump', 'Angela Merkel', 'Boris Johnson', 'Shinzo Abe', 'Justin Trudeau', 'Scott Morrison']
    required = False
    documents = []
    k = 0
    for j in range(12):
        for i in range(5):
            ib_rates2 = ib_rates[random.randint(0, len(ib_rates) - 1)]
            ib_rate = ib_rates2[0]
            fx_rates = ib_rates2[1]
            bank_data = banks[random.randint(0, len(banks) - 1)]

            bank_name, bank_id, bank_country = bank_data[0], bank_data[1], bank_data[2]
            fee = fees[random.randint(0, len(fees) - 1)]
            document = {
                'RecordId': k,
                'ib_api_auto_update': True,
                'CurrentState': {
                    'currency_from': currencies[random.randint(0, len(currencies) - 1)],
                    'currency_to': currencies[random.randint(0, len(currencies) - 1)],
                    'language': official_languages[random.randint(0, len(official_languages) - 1)],
                    'leader': leaders[random.randint(0, len(leaders) - 1)],
                    'ResearcherName': researchers[random.randint(0, len(researchers) - 1)],
                    'Author': researchers[random.randint(0, len(researchers) - 1)],
                    db_params.CAPITAL: "Berlin",
                    db_params.POPULATION_DENSITY: None,
                    db_params.POPULATION: populations[random.randint(0, len(populations) - 1)],
                    db_params.AREA_KM2: areas[random.randint(0, len(areas) - 1)],
                    db_params.NUMBER_OF_LAKES: areas[random.randint(0, len(lakes) - 1)],
                    db_params.GDP_GROWTH: gdp_growth[random.randint(0, len(gdp_growth) - 1)],
                    db_params.CONSUMER_MARGINS: [
                        {'_id': ObjectId.from_datetime(
                            datetime.datetime.now() - datetime.timedelta(seconds=random.randint(0, 1000000))),
                            'amount': amounts[random.randint(0, len(amounts) - 1)],
                            'ib_rate': ib_rate,
                            'fx_rate': fx_rate,
                            'timestamp': (
                                    datetime.datetime.now() - datetime.timedelta(
                                seconds=(j * (86400 * 31))) - datetime.timedelta(
                                seconds=random.randint(0, 7 * 60 * 60 * 24))).isoformat(),
                            'fx_margin': ((ib_rate - fx_rate) / ib_rate) * 100,
                            'fee': fee,
                            'full_cost': None,
                            'is_consumer': ['Yes', 'No', 'Yes', 'No'][random.randint(0, 3)],
                            'was_reviewed': [True, False][random.randint(0, 1)],
                            'org_name': banks[random.randint(0, len(banks) - 1)][0],
                            'number_of_providers': random.randint(0, 100)
                        } for fx_rate in fx_rates
                    ],
                    'CommercialMargins': [
                        {'_id': ObjectId.from_datetime(
                            datetime.datetime.now() - datetime.timedelta(seconds=random.randint(0, 1000000))),
                            'amount': amounts[random.randint(0, len(amounts) - 1)],
                            'ib_rate': ib_rate,
                            'fx_rate': fx_rate,
                            'timestamp': (
                                    datetime.datetime.now() - datetime.timedelta(
                                seconds=(j * (86400 * 31))) - datetime.timedelta(
                                seconds=random.randint(0, 7 * 60 * 60 * 24))).isoformat(),
                            'fx_margin': ((ib_rate - fx_rate) / ib_rate) * 100,
                            'fee': fee,
                            'full_cost': None,
                            'is_consumer': ['Yes', 'No', 'Yes', 'No'][random.randint(0, 3)],
                            'org_name': banks[random.randint(0, len(banks) - 1)][0]
                        } for fx_rate in fx_rates
                    ],
                    'Bank Name': bank_name,
                    'fxci_id': bank_id,
                    'bank_country_iso3': bank_country,
                    'CollectedDate': datetime.datetime(random.randint(2018, 2022), random.randint(1, 12),
                                                       random.randint(1, 28), random.randint(10, 23), 21, 00,
                                                       000000),
                    'ClientType': False,
                    'qa_status': qa_statuses[random.randint(0, len(qa_statuses) - 1)],
                    'Selected': None,
                    "ImageLinks": {
                        "field1": [
                            "s3://fxci.card-data-collection/dummy_tnc_screenshots_and_pdfs_for_development/tnc_screenshots_and_pdfs/16WYAeFG-Ec-otoSFz-XlRH1a3faPygom.png",
                            "https://s3.eu-west-1.amazonaws.com/fxci.card-data-collection/tnc_screenshots_and_pdfs/1581593242081_6_image.png",
                            "https://s3.eu-west-1.amazonaws.com/fxci.card-data-collection/tnc_screenshots_and_pdfs/12nmADKjDr-oOuIazlPovI55oFNpwtXqQ1580314999641.jpg"
                        ],
                        "field2": [],
                        "field3": [
                            "https://s3.eu-west-1.amazonaws.com/fxci.card-data-collection/tnc_screenshots_and_pdfs/12nmADKjDr-oOuIazlPovI55oFNpwtXqQ1580315073007.jpg"
                        ]
                    },
                }, 'AuditState': {
                    'AuditNumber': 0,
                    'LastEditedAt': None,
                    'LastEditedBy': None,
                    'ConfidenceScore': None,
                    'NoteOnConfidenceScore': None
                }
            }
            documents.append(document)
            k += 1

    for document in documents:

        document['CurrentState']['collection_id'] = '_'.join(
            [
                str(document['CurrentState'][field_name]) for field_name in [
                'bank_country_iso3', 'Bank Name', 'currency_from', 'currency_to',
                'CollectedDate', 'ResearcherName', 'qa_status'
            ]
            ]
        )

        if document['CurrentState']['currency_from'] == document['CurrentState']['currency_to']:
            document['CurrentState']['currency_from'] = \
                list(set(currencies) - set([document['CurrentState']['currency_from']]))[
                    random.randint(0, len(currencies) - 2)]

        for margin_doc in document['CurrentState']['ConsumerMargins']:
            margin_doc['full_cost'] = (
                                              ((margin_doc['ib_rate'] - margin_doc['fx_rate']) / margin_doc[
                                                  'ib_rate']) * 100) + (
                                              (margin_doc['fee'] / margin_doc['amount']) * 100)
        for margin_doc in document['CurrentState']['CommercialMargins']:
            margin_doc['full_cost'] = (
                                              ((margin_doc['ib_rate'] - margin_doc['fx_rate']) / margin_doc[
                                                  'ib_rate']) * 100) + (
                                              (margin_doc['fee'] / margin_doc['amount']) * 100)
    upd_logics = [{
        "dependency_fields": [
            "ConsumerMargins.fx_rate",
            "ConsumerMargins.ib_rate"
        ],
        "update_logic": "{return ((this['ib_rate'] - this['fx_rate']) / this['ib_rate']) * 100.0;}",
        "updated_field": "ConsumerMargins.fx_margin"
    },
        {
            "dependency_fields": [
                "ConsumerMargins.fx_rate",
                "ConsumerMargins.ib_rate",
                "ConsumerMargins.fee",
                "ConsumerMargins.amount"
            ],
            "update_logic": "{return (((this['ib_rate'] - this['fx_rate']) / this['ib_rate']) * 100.0) + (this['fee'] / this['amount']);}",
            "updated_field": "ConsumerMargins.full_cost"
        },
        {
            "dependency_fields": [
                "CommercialMargins.fx_rate",
                "CommercialMargins.ib_rate"
            ],
            "update_logic": "{return ((this['ib_rate'] - this['fx_rate']) / this['ib_rate']) * 100.0;}",
            "updated_field": "CommercialMargins.fx_margin"
        },
        {
            "dependency_fields": [
                "CommercialMargins.fx_margin",
                "CommercialMargins.fee",
                "CommercialMargins.amount"
            ],
            "update_logic": "{return  this['fx_margin'] + (this['fee'] / this['amount']);}",
            "updated_field": "CommercialMargins.full_cost"
        },
        {'dependency_fields': ['population', 'area_km2'],
         'update_logic': "{const population = CurrentState['population']; const area = CurrentState['area_km2']; "
                         "if ((area === null) || (population === null)) {throw 'area and population cannot be "
                         "nulls.'} else if (area === 0) {throw 'the area of a country cannot be null'} else {"
                         "return population / area;};}",
         'updated_field': 'population_density_(person/km2)'},
        {'dependency_fields': ['population_density_(person/km2)'],
         'update_logic': "{return 'value';}",
         'updated_field': 'capital'}
    ]
    c2 = {
        'CollectionRelevantFor': collection_name,
        'DisplayImages': True,
        'DefaultFieldsToDisplayInAuditSession':
            ['currency_from',
             'currency_to',
             'area_km2',
             'capital',
             'number_of_lakes',
             'population',
             'population_density_(person/km2)',
             'leader',
             'gdp_growth',
             'language',
             'ResearcherName',
             'Author',
             'Bank Name',
             'CollectedDate',
             {
                 "name": "ConsumerMargins",
                 "DefaultFieldsToDisplayInAuditSession": [
                     "amount",
                     "ib_rate",
                     "fx_rate",
                     "timestamp",
                     "fx_margin",
                     "fee",
                     "full_cost",
                     "org_name",
                     "number_of_providers",
                     "is_consumer",
                     "was_reviewed"
                 ],
                 "AllSubDocumentFields": [
                     "amount",
                     "ib_rate",
                     "fx_rate",
                     "timestamp",
                     "fx_margin",
                     "fee",
                     "full_cost",
                     "org_name",
                     "number_of_providers",
                     "is_consumer",
                     "was_reviewed"
                 ]
             },
             {
                 "name": "CommercialMargins",
                 "DefaultFieldsToDisplayInAuditSession": [
                     "amount",
                     "ib_rate",
                     "fx_rate",
                     "timestamp",
                     "fx_margin",
                     "fee",
                     "full_cost",
                     "org_name",
                     "number_of_providers",
                     "is_consumer"
                 ],
                 "AllSubDocumentFields": [
                     "amount",
                     "ib_rate",
                     "fx_rate",
                     "timestamp",
                     "fx_margin",
                     "fee",
                     "full_cost",
                     "org_name",
                     "number_of_providers",
                     "is_consumer"
                 ]
             }, 'ClientType'],
        'DefaultSearchFieldName': 'RecordId',
        'SearchFieldNames': [
            'RecordId',
            'CurrentState.currency_from',
            'CurrentState.currency_to',
            'CurrentState.population',
            'CurrentState.gdp_growth',
            'CurrentState.ResearcherName',
            'CurrentState.Bank Name',
            'CurrentState.CollectedDate',
            'CurrentState.ClientType',
            'AuditState.ConfidenceScore',
            'AuditState.LastEditedBy',
            'AuditState.LastEditedAt',
            'AuditState.NoteOnConfidenceScore',
            'AuditState.AuditNumber'
        ],
        'DefaultFieldsToDisplayInSearchResultView': [
            'RecordId',
            'CurrentState.currency_from',
            'CurrentState.currency_to',
            'CurrentState.ResearcherName',
            'CurrentState.Bank Name',
            'CurrentState.CollectedDate',
            'CurrentState.ClientType',
            'AuditState.ConfidenceScore',
            'AuditState.LastEditedBy',
            'AuditState.LastEditedAt',
            'AuditState.NoteOnConfidenceScore'
        ],
        'UnEditableFields': ["ConsumerMargins._id",
                             "ConsumerMargins.fx_margin",
                             "CommercialMargins._id",
                             "CommercialMargins.fx_margin"],
        'Visibility': {'public': True},
        'UnDisplayableFields': ["ConsumerMargins._id",
                                "CommercialMargins._id"],
        'Validators': [

            {'name': 'currency_from',
             'type': 'enumerate',
             'constraints': {'values': currencies, 'multiple': False,
                             'nullable': False}},

            {'name': 'currency_to',
             'type': 'enumerate',
             'constraints': {'values': currencies, 'multiple': False}},

            {'name': 'area_km2',
             'type': 'numeric'},
            {'name': 'number_of_lakes',
             'type': 'numeric',
             'constraints': {'positive': True, 'gt': 1, 'lt': 10000000}},

            {'name': 'population',
             'type': 'numeric',
             'constraints': {'positive': True}},

            {'name': 'population_density_(person/km2)',
             'type': 'numeric',
             'constraints': {}},
            {'name': 'collection_id',
             'type': 'numeric'},

            {'name': 'gdp_growth',
             'type': 'numeric',
             'constraints': {'gte': -5, 'lte': 20}},

            {'name': 'language',
             'type': 'enumerate',
             'constraints': {'values': official_languages, 'multiple': True}},

            {'name': 'ResearcherName', 'type': 'text', 'constraints': {}},
            {'name': 'leader', 'type': 'text', 'constraints': {
                'maxLength': 6,
                'minLength': 2
            }},
            {'name': 'Author', 'type': 'text', 'constraints': {
                'maxLength': 6,
                'minLength': 2
            }},

            {'name': 'Bank Name', 'type': 'enumerate', 'constraints': {'values': banks, 'multiple': False}},

            {'name': 'CollectedDate',
             'type': 'isodate',
             'constraints': {'gte': datetime.datetime(2000, 1, 1, 21, 21, 00, 000000),
                             'lte': datetime.datetime(2022, 1, 1, 21, 21, 00, 000000)}},

            {'name': 'ClientType', 'type': 'bool',
             'constraints': {}},

            {'name': 'bank_country_iso3',
             'type': 'enumerate',
             'constraints': {'values': ['USA', 'GBR', 'CAD', 'AUD'], 'multiple': False}},

            # {'name': 'is_consumer',
            #  'type': 'enumerate',
            #  'constraints': {'values': ['Yes', 'No'], 'multiple': False}},

            {'name': 'qa_status',
             'type': 'enumerate',
             'constraints': {'values': ['approved', 'rejected'], 'multiple': False}},

            {'name': 'Selected',
             'type': 'enumerate',
             'constraints': {'values': ['true', 'false'], 'multiple': False}},
            {
                "name": "ConsumerMargins.fx_rate",
                "type": "numeric",
                "constraints": {
                    "positive": True,
                    "gt": 0.1,
                    "lt": 100
                }
            },
            {
                "name": "ConsumerMargins.fx_margin",
                "type": "numeric"
            },
            {
                "name": "CommercialMargins.fx_margin",
                "type": "numeric"
            },
            {
                "name": "ConsumerMargins.was_reviewed",
                "type": "bool"
            },
            {
                "name": "ConsumerMargins.org_name",
                "type": "text",
                'constraints': {
                    'maxLength': 6,
                    'minLength': 2
                }
            },
            {
                "name": "ConsumerMargins.ib_rate",
                "type": "numeric",
                "constraints": {
                    "positive": True,
                    "gt": 0.01,
                    "lt": 100
                }
            },
            {
                "name": "ConsumerMargins.amount",
                "type": "numeric",
                "constraints": {
                    "positive": True,
                    "gt": 1000,
                    "lt": 1000000
                }
            },
            {
                "name": "ConsumerMargins.number_of_providers",
                "type": "numeric",
                "constraints": {
                    "positive": True
                }
            },
            {
                "name": "ConsumerMargins.timestamp",
                "type": "date",
                "constraints": {
                    "gte": datetime.datetime(2000, 1, 1, 21, 21, 00, 000000),
                    "lte": datetime.datetime(2025, 1, 1, 21, 21, 00, 000000),
                }
            },
            {
                "name": "CommercialMargins.fx_rate",
                "type": "numeric",
                "constraints": {
                    "positive": True,
                    "nullable": False
                }
            },
            {
                "name": "CommercialMargins.ib_rate",
                "type": "numeric",
                "constraints": {
                    "positive": True
                }
            },
            {
                "name": "CommercialMargins.amount",
                "type": "numeric",
                "constraints": {
                    "positive": True
                }
            },
            {
                "name": "CommercialMargins.timestamp",
                "type": "date",
                "constraints": {
                    "gt": datetime.datetime(2000, 1, 1, 21, 21, 00, 000000),
                    "lt": datetime.datetime(2025, 1, 1, 21, 21, 00, 000000),
                    "nullable": False
                }
            },
            {
                "name": "ConsumerMargins.fee",
                "type": "numeric",
                "constraints": {
                    "positive": True
                }
            },
            {
                "name": "ConsumerMargins.full_cost",
                "type": "numeric",
                "constraints": {
                    "positive": True
                }
            },
            {
                "name": "CommercialMargins.fee",
                "type": "numeric",
                "constraints": {
                    "positive": True
                }
            },
            {
                "name": "CommercialMargins.full_cost",
                "type": "numeric",
                "constraints": {
                    "positive": True
                }
            },
            {
                "name": "CommercialMargins.is_consumer",
                "type": "enumerate",
                "constraints": {
                    "multiple": True,
                    "values": [
                        "True",
                        "False"
                    ]
                }
            },
            {
                "name": "ConsumerMargins.is_consumer",
                "type": "enumerate",
                "constraints": {
                    "multiple": False,
                    "values": [
                        "True",
                        "False"
                    ]
                }
            }
        ],
        'FieldsToDisplayOnMiddleScreen': [
            'currency_from',
            'currency_to',
            'ResearcherName',
            'ConsumerMargins',
            'CommercialMargins',
            'Bank Name',
            'CollectedDate',
            'ClientType'
        ],

        'ConfidenceScores': {'DisplayScoreText': 'Over All Confidence Score',
                             'DisplayNoteText': 'Note on confidence score',
                             'ConfidenceScoreOptions': {
                                 'Totally Wrong': 0,
                                 'Unsure': 1,
                                 'Confident': 2,
                                 'Very Confident': 3,
                                 'Unfinished': -999
                             }},

        'update_logics': upd_logics,
        'ConfidenceScoreRequired': required
    }
    delete_mongo(collection_name, {}, False)
    insert_mongo(collection_name, documents)
    delete_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name})
    insert_mongo(db_params.CONFIGURATION, c2, True)


def gen_test_data(collection_name):
    if collection_name == db_params.TESTING_HALINA:
        create_random_docs_and_config(collection_name)
    else:
        if collection_name in [db_params.IMTI_V_95_NE_AUD_HALINA,
                               db_params.GLOB_TEST_WITH_EXC_FOR_APP,
                               db_params.GLOB_TEST_WITH_EXC]:
            reference_collection = db_params.IMTI_V_95_PRISTINE
            reference_config = db_params.IMTI_V_95
        elif collection_name == db_params.TEST_FX_FEES_0_2:
            reference_collection = db_params.FX_FEES_0_2
            reference_config = db_params.FX_FEES_0_2
        elif collection_name == db_params.TEST_FX_FEES_0_3:
            reference_collection = db_params.FX_FEES_0_3
            reference_config = db_params.FX_FEES_0_3
        delete_mongo(collection_name, {}, False)
        copy_collection_to_another_mongo(reference_collection, collection_name)
        delete_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name})
        collection_configuration = find_docs_in_collection(db_params.CONFIGURATION,
                                                           {db_params.COLLECTION_RELEVANT_FOR: reference_config})
        insert_mongo(db_params.CONFIGURATION, collection_configuration, True)


def generate_test_data(collections=None):
    new_collections = collections if collections else [db_params.IMTI_V_95_NE_AUD_HALINA,
                                                       db_params.GLOB_TEST_WITH_EXC_FOR_APP,
                                                       db_params.GLOB_TEST_WITH_EXC, db_params.TEST_FX_FEES_0_2,
                                                       db_params.TEST_FX_FEES_0_3]
    for col in new_collections:
        if col == db_params.TEST_FX_FEES_0_2:
            col_to_copy = db_params.FX_FEES_0_2
        elif col == db_params.TEST_FX_FEES_0_3:
            col_to_copy = db_params.FX_FEES_0_3
        else:
            col_to_copy = db_params.IMTI_V_95_PRISTINE

        copy_collection_to_another_mongo(col_to_copy, col)
        ref_collection = col_to_copy if col in [db_params.TEST_FX_FEES_0_2,
                                                db_params.TEST_FX_FEES_0_3] else db_params.IMTI_V_95
        collection_configuration = find_docs_in_collection(db_params.CONFIGURATION,
                                                           {db_params.COLLECTION_RELEVANT_FOR: ref_collection})
        del collection_configuration['_id']
        collection_configuration[db_params.COLLECTION_RELEVANT_FOR] = col
        delete_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: col})
        insert_mongo(db_params.CONFIGURATION, collection_configuration, True)
    if collections is None:
        create_random_docs_and_config(db_params.TESTING_HALINA)


def record_regenerate(record_id, collection_name):
    ref_collection = ""
    if collection_name == db_params.TEST_FX_FEES_0_2:
        ref_collection = db_params.FX_FEES_0_2
    elif collection_name == db_params.TEST_FX_FEES_0_3:
        ref_collection = db_params.FX_FEES_0_3
    elif collection_name in [db_params.GLOB_TEST_WITH_EXC_FOR_APP, db_params.GLOB_TEST_WITH_EXC,
                             db_params.IMTI_V_95_NE_AUD_HALINA]:
        ref_collection = db_params.IMTI_V_95_PRISTINE
    reference_record = find_docs_in_collection(ref_collection, {
        db_params.RECORD_ID: record_id})
    delete_mongo(collection_name, {db_params.RECORD_ID: record_id})
    insert_mongo(collection_name, reference_record, True)


def config_regenerate(collection_name):
    if collection_name == db_params.TEST_FX_FEES_0_2:
        ref_config = db_params.FX_FEES_0_2
    elif collection_name == db_params.TEST_FX_FEES_0_3:
        ref_config = db_params.FX_FEES_0_3
    else:
        ref_config = db_params.IMTI_V_95
    reference_config = find_docs_in_collection(db_params.CONFIGURATION, {
        db_params.COLLECTION_RELEVANT_FOR: ref_config})
    delete_mongo(db_params.CONFIGURATION, {db_params.COLLECTION_RELEVANT_FOR: collection_name})
    del reference_config['_id']
    reference_config[db_params.COLLECTION_RELEVANT_FOR] = collection_name
    insert_mongo(db_params.CONFIGURATION, reference_config, True)

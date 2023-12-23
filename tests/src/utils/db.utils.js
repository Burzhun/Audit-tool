import {CONFIGURATION, DELETE, DELETE_ONE, FIND, FIND_ONE, INSERT_MANY, INSERT_ONE, PROPAGATE} from './db.params';
import {mongoDBRequest} from '@fxc/ui-test-framework';

export async function recreateCollection(collectionName, params) {
    await mongoDBRequest(collectionName, {}, DELETE);
    if ('isPart' in params) {
        const docsRefCollection = await mongoDBRequest(params.refCol, {}, FIND);
        await mongoDBRequest(collectionName, docsRefCollection.slice(0, params.isPart), INSERT_MANY)
    } else {
        await mongoDBRequest(collectionName, [{$match: {}},
            {$out: collectionName}
        ], PROPAGATE, params.refCol);
    }

    await recreateConfig(collectionName, params);
}

export async function recreateConfig(collectionName, params) {
    const referenceConfig = await mongoDBRequest(CONFIGURATION,
        {CollectionRelevantFor: params.refConfig});
    referenceConfig.CollectionRelevantFor = collectionName
    delete referenceConfig._id;
    await mongoDBRequest(CONFIGURATION, {CollectionRelevantFor: collectionName}, DELETE_ONE);
    await mongoDBRequest(CONFIGURATION, referenceConfig, INSERT_ONE);
}

export async function recreateRecord(collectionName, recordId, params) {
    await mongoDBRequest(collectionName, {RecordId: recordId}, DELETE_ONE);
    const docToBeRecreated = await mongoDBRequest(params.refCol, {RecordId: recordId}, FIND_ONE);
    await mongoDBRequest(collectionName, docToBeRecreated, INSERT_ONE);
    await recreateConfig(collectionName, params)
}
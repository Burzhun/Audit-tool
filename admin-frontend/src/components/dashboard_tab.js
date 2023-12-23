const tab_fields={
    'Search Screen':[
        'add_new_record',
        'DefaultFieldsToDisplayInSearchResultView',
        'DefaultSearchFieldName',
        'SearchFieldNames',
        'UnDisplayableFields'
    ],
    'Audit Screen':[
        'AllowCopyFunction',
        'AllowImageAndPdfDownloads',
        'ConfidenceScores',
        'ConfidenceScoreRequired',
        'DefaultFieldsToDisplayInAuditSession',
        'DefaultSortings',
        'FieldsToDisplayOnMiddleScreen',
        'UnEditableFields'
    ],
    'Images':[
        'allow_image_file_upload',
        'DisplayImages',
        'image_edit_options',
        'ImageFieldNames',
    ],
    'Charts': ['Charts'],
    'User Access': ['Visibility'],
    'API Calls': ['ib_api_auto_update'], 
    'Automatic Updates':[
        'global_automatic_updates',
        'update_logic',
        'update_logic',
        'updates_manual_overwrite_fields'
    ]
}
const dashboard_tab_fieldlist = (tab_name, all_fields)=>{
    return tab_fields[tab_name] ? tab_fields[tab_name].filter(f=>all_fields.includes(f)) : [];
}
export default dashboard_tab_fieldlist;

import React, { useEffect } from 'react';
import { Table, Input } from 'semantic-ui-react';
import _ from 'lodash';
export default function ArrayRowFilter (props){	

	return (
        <React.Fragment>
            <Table.Cell
                key={props.mainFieldName + 'header'}>
            </Table.Cell>
            {props.fieldNames.map((field, index) => {
                return <Table.Cell key={'array_row_filter'+field}>
                        <Input
                            className='filterInput'
                            onChange={(ev, data)=>props.onFilter(ev, field)}
                            icon='search'
                            value={props.filters[field] ? props.filters[field] : ''}
                            data-qa={field}
                            data-qa-type="search-bar"
                        />
                </Table.Cell>
            })}
        </React.Fragment>
    )
}

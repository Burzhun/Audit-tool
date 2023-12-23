import React from 'react';
import PropTypes from 'prop-types'
import {Popup, Table} from 'semantic-ui-react';


export default class CurrentDataCell extends React.Component {
    static propTypes = {
        rowData: PropTypes.object.isRequired,
        config: PropTypes.object.isRequired,
        convertTime: PropTypes.func.isRequired,
        changedValues: PropTypes.object.isRequired,
        dataType: PropTypes.string.isRequired,
    };

    defineCurrentData() {
        let {name, value} = this.props.rowData;
        if(Array.isArray(value)){
            return value.join(', ').replace(/\\\'/g,"'").replace(/\\\"/g,'"');
        }
        if(typeof value==='string') value = value.replace(/\\\'/g,"'").replace(/\\\"/g,'"');
        if (name === 'CollectedDate' && value !== null) {
            return this.props.convertTime(value)
        }
        if (typeof value === 'boolean') {
            value = String(value)
            value = value.charAt(0).toUpperCase() + value.slice(1);
        }
        if (Number(value) === value && value % 1 !== 0){
            if(this.props.config.FloatDisplayPrecision){
                const option = this.props.config.FloatDisplayPrecision.find(t=>t.name===name);
                if(option) return (value).toFixed(option.value);
            }
            return (value).toFixed(4);
        }
        
        if (/^http/.test(value)) {
            return <a href={value} target={'_blank'}>{value}</a>
        } else {
            if(typeof value ==='object') return null;
            return value
        }
    }

    render() {
        return (
            <Popup
                content={
                    <div>
                        <p>Data type: {this.props.dataType}</p>
                        <p>{this.defineCurrentData()}</p>
                    </div>
                }
                pinned
                position={'top right'}
                trigger={<Table.Cell style={{textAlign: 'right', width: this.props.width}}
                                     name='value'>{this.defineCurrentData()}</Table.Cell>}
            />
        )
    }
}

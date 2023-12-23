import React from 'react';
import PropTypes from 'prop-types'
import {Button, Select} from "semantic-ui-react";
import GlobalUpdateButton from '../../../components/globalUpdate/globalUpdateButton';


export default class AuditHeader extends React.Component {

    static propTypes = {
        visibleMenu: PropTypes.array.isRequired,
        data: PropTypes.object.isRequired,
        RecordId: PropTypes.string.isRequired,
        config: PropTypes.object.isRequired,
        anchor: PropTypes.number.isRequired,
        addAuditField: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            visibleMenu: [],
            restoredFields: [],
            anchor: 0,
            selector_value: '',
            pipeline_message: 'Update Calculated Fields'
        }
        this.addField = this.addField.bind(this);
        this.scrollTo = this.scrollTo.bind(this);
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.props.visibleMenu !== prevState.visibleMenu) {
            this.setState({visibleMenu: this.props.visibleMenu})
        }
    }


    addField() {
        const value = this.state.selector_value;
        if (this.props.deletedFields.includes(value)) this.props.restoreField(value);
        else{
            if(value.includes('.')){
                this.props.restoreField(value);

            }
        }
        if (value && !this.state.visibleMenu.includes(value)) {
            let visibleMenu = [...this.props.visibleMenu];
            visibleMenu.unshift(value);
            this.setState({
                visibleMenu: visibleMenu,
                anchor: value
            }, () => this.scrollTo());
            if(!value.includes('.'))
                this.props.addAuditField(visibleMenu);
        }
        //this.setState({selector_value: ''})
    }

    scrollTo() {
        const element = document.getElementById(this.state.anchor);
        if (element) {
            element.style.backgroundColor = '#f5d5f1';
            setTimeout(() => element.style.backgroundColor = element.className==='disabledRow' ? '#f1f1f1' : '#ffffff', 700);
        }
    }

    getSelectorList() {
        let selectorOptions = [];
        if (this.props.config && this.props.config.UnDisplayableFields) {
            selectorOptions = Object.keys(this.props.data.CurrentState).filter(
                (key) => (!this.props.visibleMenu.includes(key) || this.props.deletedFields.includes(key)) && key.split('.').length<3 && !this.props.config.UnDisplayableFields.includes(key) && key!=='ImageLinks'
            );
            const complex_fields = this.props.config.DefaultFieldsToDisplayInAuditSession.filter(f=>f.name && f.nested_fields).map(f=>f.name);
            Object.keys(this.props.data.CurrentState).forEach(key=>{
                const ar = key.split('.');
                if(ar.length===3 && complex_fields.includes(ar[0])){
                    if(this.props.deletedFields.includes(key)) selectorOptions.push(key);
                }
            });
            if(this.props.schema){
                complex_fields.forEach(complex_field=>{
                    const subFields = this.props.config.DefaultFieldsToDisplayInAuditSession.find(f=>f.name===complex_field).nested_fields;
                    const data_keys = Object.keys(this.props.data.CurrentState);
                    const field_keys = data_keys.filter(f=>f.startsWith(complex_field+'.') && f.endsWith('._id'));
                    this.props.schema.fields.forEach(field=>{
                        if(field.name.startsWith('CurrentState.'+complex_field+'.[].')){
                            const ar = field.name.split('.');
                            if(ar.length===4 && !subFields.includes(ar[3]) && ar[3]!=='_id'){
                                field_keys.forEach(f=>{
                                    const k = f.replace('._id','.'+ar[3]);
                                    if(!data_keys.includes(k))
                                        selectorOptions.push(k)
                                })
                            }
                        }
                    })
                })
            }
            
        }
        //console.log(selectorOptions);
        //console.log(selectorOptions.concat(this.props.deletedFields));
        return selectorOptions.map(item => {
            return {value: item, text: item.replace('.index','')}
        })
    }


    render() {
        const selector_list = this.getSelectorList();
        if(!this.props.data) return null;
        return (
            <React.Fragment>
                <div className="left-pane-header">
                    <div>
                        <Button data-qa="add-field" className='green' style={{width: '100px'}} onClick={this.addField}> Add </Button>
                        <Select search placeholder='Select Field'
                                onChange={(e, data) => this.setState({selector_value: data.value})}
                                options={selector_list} data-qa="select-field"/>
                    </div>
                    <p className="paragraph">
                        Last Updated By {this.props.data['AuditState']['LastEditedBy']}
                    </p>
                    {this.props.config.global_automatic_updates && this.props.config.global_automatic_updates.length > 0 &&
                    <GlobalUpdateButton collectionName={this.props.collectionName}
                        recordId={this.props.RecordId}
						audit_info={this.props.audit_info}
                        afterUpdate={this.props.getDataByFirmID}/>
                    }
                    {this.props.show_fields_button &&
                    <Button data-qa="show-fields" onClick={this.props.show_fields} style={{float: 'right'}}>Show fields</Button>}

                </div>
                <div style={{display: 'flex', justifyContent: 'left'}}>
                    <p>Record ID : {this.props.RecordId}</p>
                </div>
                
            </React.Fragment>
        )
    }
}

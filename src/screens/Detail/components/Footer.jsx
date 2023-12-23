import React from 'react';
import PropTypes from 'prop-types'
import {Button, Input, Select} from 'semantic-ui-react';
import CustomPopup from './CustomPopup';
import Cookies from 'universal-cookie';
import validate from '../../../lib/validators';
import TextRepresentationModal from './TextRepresentationModal';

export default class Footer extends React.Component {

    static propTypes = {
        audit_info: PropTypes.object.isRequired,
        previousAudit: PropTypes.object.isRequired,
        config: PropTypes.object.isRequired,
        changedValues: PropTypes.object.isRequired,
        RecordId: PropTypes.string.isRequired,
        collectionName: PropTypes.string.isRequired,
        user: PropTypes.object.isRequired,
        saveData: PropTypes.func.isRequired,
        copyRecord: PropTypes.func.isRequired,
        setConfidence: PropTypes.func.isRequired,
        updateRecord: PropTypes.func.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            confidenceError: '',
            changedValues: {},
        }
        this.setConfidence = this.setConfidence.bind(this)
        this.setNote = this.setNote.bind(this)
        this.copyRecord = this.copyRecord.bind(this)
        this.saveData = this.saveData.bind(this)
    }

    setConfidence(el, val) {
        this.props.setConfidence({...this.props.audit_info, ConfidenceScore: val.value, confidenceError: ''})
    }

    setNote(el, val) {
        this.props.setConfidence({...this.props.audit_info, NoteOnConfidenceScore: val.value})
    }

    copyRecord() {
        if (this.props.config.AllowCopyFunction !== true) {
            alert('Copy Functionality Not Allowed for this Dataset');
            return;
        }
        if (!window.confirm('Are you going to copy this record?')) {
            return;
        }
        this.props.copyRecord(this.props.user.email);
        this.forceUpdate()
    }

    saveData() {
        let {audit_info, changedValues, RecordId, additional_complex_data} = this.props;
        Object.keys(changedValues).forEach(key => {
            if (changedValues[key]['valid'] === undefined) {
                const t = Object.keys(changedValues[key]).find(sub_key => Object.keys(changedValues[key][sub_key]).length > 0);
                if (!t) delete changedValues[key];
            }
        })
        if (Object.keys(changedValues).length === 0 || !Object.keys(changedValues).find(key => Object.keys(changedValues[key]).length > 0)) {
            if (this.props.audit_info.ConfidenceScore === undefined || this.props.audit_info.ConfidenceScore === this.props.auditState.ConfidenceScore) {
                if (this.props.audit_info.NoteOnConfidenceScore === undefined || this.props.audit_info.NoteOnConfidenceScore === this.props.auditState.NoteOnConfidenceScore) {
                    window.alert('You have not changed any data. Please make audit and try again.')
                    return;
                }
            }
        }
        if ((this.props.audit_info.ConfidenceScore === null || this.props.audit_info.ConfidenceScore === undefined) && this.props.config.ConfidenceScoreRequired) {
            this.setState({confidenceError: 'This field is required'}, () => {
                    var error_message_element = document.querySelectorAll('.confidence_score_required_error');
                    if (error_message_element.length > 0)
                        error_message_element[0].scrollIntoView();
                }
            );
            return
        } else {
            if (this.state.confidenceError)
                this.setState({confidenceError: false});
        }
        let blockingValue = null;
        let blockingField = null;
        let groupValues = null;
        const error_key_unique = Object.keys(this.props.blockedFields).find(k => {
            const f = this.props.blockedFields[k];
            const blockKey = Object.keys(f.index).find(key => f.index[key].blocked === true)
            if (f.index && blockKey) {
                blockingValue = f.index[blockKey].blockingValue;
                blockingField = k;
                groupValues = f.index[blockKey].group_values;
                return true;
            }
            return false;
        });
        if (error_key_unique) {
            let message = `Your audit has been blocked. For violating the 'blocking rule'. Specifically, the value "${blockingValue}" prevents additional values in the field "${blockingField}" being added in other tables given the following grouping conditions.`
            if (groupValues) {
                message += '\n\nGrouping Fields';
                Object.keys(groupValues).forEach(key => {
                    message += `\n ${key}: ${groupValues[key]}`;
                });
            }
            alert(message);
            return;
        }
        const cookies = new Cookies();
        const cookie_config = cookies.get('config');
        const config = cookie_config ? cookie_config : this.props.config;
        let message = 'Are you sure?';
        let audit_previous = false;
        const intersection = Object.keys(changedValues).filter(value => Object.keys(this.props.previousAudit).includes(value));
        if (intersection.length > 0) {
            audit_previous = true;
            message = 'You are going to edit audited fields: \n' + intersection
        }
        const errors = validate(config, changedValues, this.props.data.CurrentState);
        if (Object.keys(errors).length > 0 && errors.constructor === Object) {
            this.setState({errors: errors}, () => {
                var error_message_element = document.querySelectorAll('.error_message');
                if (error_message_element.length > 0) {
                    error_message_element[0].parentElement.scrollIntoView();
                    var position_top = error_message_element[0].parentElement.getBoundingClientRect().top;
                    if (position_top < 100)
                        document.querySelector(".dialogContainer").parentElement.scrollBy(0, -position_top - 100);
                }
            });
            this.props.updateRecord(changedValues, errors);
            return;
        }
        if (audit_previous && !window.confirm(message)) {
            return;
        }
        this.props.saveData({
            recordId: RecordId,
            changedValues: changedValues,
            audit_info: audit_info,
            collectionName: this.props.collectionName,
            callback: (new_errors, saveValues) => {
                this.props.updateRecord(saveValues ? changedValues : {}, saveValues ? new_errors : {}, saveValues ? additional_complex_data : {});
                this.setState({changedValues: changedValues})
            }
        });
        this.setState({errors: [], changedValues: {}})
        //this.props.updateRecord({}, {});
        this.forceUpdate()
    }

    render() {
        if (!this.props.data) return null;

        let confidence_options = [
            {text: 'Unfinished', value: -999},
            {text: 'Totally Wrong', value: 0},
            {text: 'Unsure', value: 1},
            {text: 'Confident', value: 2},
            {text: 'Very Confident', value: 3}
        ];
        let DisplayScoreText = 'Over All Confidence Score';
        let DisplayNoteText = 'Note on confidence score';
        if (this.props.config.ConfidenceScores) {
            const conf_options = this.props.config.ConfidenceScores;
            if (conf_options.ConfidenceScoreOptions) {
                const t = conf_options.ConfidenceScoreOptions;
                confidence_options = Object.keys(t).map(function (t1) {
                    return {text: t1, value: t[t1]}
                });
            }
            if (conf_options.DisplayScoreText) DisplayScoreText = conf_options.DisplayScoreText;
            if (conf_options.DisplayNoteText) DisplayNoteText = conf_options.DisplayNoteText;
        }
        let errorMsg = ''
        if (this.state.confidenceError) {
            errorMsg = <div className="confidence_score_required_error"
                            style={{color: '#ff0000'}}>{this.state.confidenceError}</div>
        }
        return (
            <div className="footer">
                <div style={{textAlign: 'center', display: 'inline-block'}} data-qa="confidenceScore">
                    {DisplayScoreText} :
                    <Select
                        data-qa="select-confidence-score"
                        placeholder='---'
                        onChange={(e, data) => this.setConfidence(e, data)}
                        value={this.props.audit_info.ConfidenceScore === null ? undefined : this.props.audit_info.ConfidenceScore}
                        options={confidence_options}
                        required={true}
                        style={{marginLeft: '3px'}}
                    />
                    {errorMsg}
                </div>
                <div style={{textAlign: 'center', display: 'inline-block', marginLeft: '10px'}}
                     data-qa="confidenceScoreNote">
                    {DisplayNoteText}:
                    <CustomPopup
                        text={this.props.audit_info.NoteOnConfidenceScore}
                        element_id='confidence_score'
                    >
                        <Input
                            className='confidenceNote'
                            value={this.props.audit_info.NoteOnConfidenceScore ? this.props.audit_info.NoteOnConfidenceScore : ''}
                            style={{marginLeft: '3px'}}
                            onBlur={() => {
                                document.element_to_focus = null;
                            }}
                            id='confidence_score'
                            onChange={(e, data) => {
                                this.setNote(e, data)
                            }}
                        />
                    </CustomPopup>
                </div>
                <div style={{marginLeft: '10px', textAlign: 'center', display: 'inline-block'}}>
                    <Button data-qa={this.props.isUpdating ? 'updating' : 'save'} className='blue'
                            onClick={this.saveData}>{this.props.isUpdating ? 'Updating...' : 'Save'}</Button>
                </div>

                {this.props.config.CopyToText && this.props.config.CopyToText.enabled && <TextRepresentationModal
                    fieldName={this.props.fieldName} collectionName={this.props.config.CollectionRelevantFor}
                    config={this.props.config} data={this.props.data.CurrentState}
                />}

                <div style={{float: 'right', textAlign: 'center', display: 'inline-block'}}>
                    <Button data-qa="copy-record" circular icon='copy' onClick={this.copyRecord}/>
                </div>
            </div>
        )
    }
}

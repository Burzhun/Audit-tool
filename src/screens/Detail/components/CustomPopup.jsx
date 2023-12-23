import React, { useEffect } from 'react';
import { Popup } from 'semantic-ui-react';

export default function CustomPopup (props){
	const text = props.text ? props.text : '';
	if(document.activeElement.id === props.element_id)
		document.element_to_focus = props.element_id;

	useEffect(()=>{
		if(document.activeElement.id==='' && document.element_to_focus){
			if(document.getElementById(document.element_to_focus))
				document.getElementById(document.element_to_focus).focus();
		}
	})

	return text.length>=14 ? <Popup style={{visibility:'hidden'}}
				 content={text}
				 on={'focus'}
				 className={'popup_element_'+props.element_id}
				 trigger={props.children} /> : props.children;
}

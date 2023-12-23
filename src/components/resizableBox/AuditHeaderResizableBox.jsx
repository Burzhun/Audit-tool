import React from 'react';
import {Table} from "semantic-ui-react";
import ResizableBox from './ResizableBox';

const AuditHeaderResizableBox=(props)=>{
    const width=props.width>90 ? props.width : 90;
    return (
        <ResizableBox width={width} className="box" axis="x"
        minConstraints={[70,90]} maxConstraints={[700, 350]}
    onResize={(e, data)=>{props.setWidth(props.field,data.size.width)}}><span>{props.children}</span></ResizableBox>
    )
}

export default AuditHeaderResizableBox

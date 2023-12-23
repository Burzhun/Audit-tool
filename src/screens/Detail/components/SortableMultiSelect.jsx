import React, { useState, useEffect, useRef } from "react";
import Select, { components } from "react-select";
import { SortableContainer, SortableElement } from "react-sortable-hoc";

function arrayMove(array, from, to) {
    array = array.slice();
    array.splice(to < 0 ? array.length + to : to, 0, array.splice(from, 1)[0]);
    return array;
}

const SortableMultiValue = SortableElement((props) => {
    // this prevents the menu from being opened/closed when the user clicks
    // on a value to begin dragging it. ideally, detecting a click (instead of
    // a drag) would still focus the control and toggle the menu, but that
    // requires some magic with refs that are out of scope for this example
    const onMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };
    const innerProps = { onMouseDown };
    return <components.MultiValue {...props} innerProps={innerProps} />;
});
const SortableSelect = SortableContainer(Select);

export default function SortableMultiSelect(props) {
    const [menuPlacement, setMenuPlacement] = useState(props.menuPlacement || 'bottom');
    useEffect(() => setMenuPlacement(props.menuPlacement || 'bottom'), [props.menuPlacement]);
    const selectRef = useRef(null);
    const onSortEnd = ({ oldIndex, newIndex }) => {
        const newValue = arrayMove(props.value, oldIndex, newIndex);
        props.onChange(newValue);
    };
    const defaultClassName = 'sortable-select-container';
    const getPosition = () => {
        const footerRect = document.querySelector('.footer').getBoundingClientRect();
        const selectRect = selectRef && selectRef.current ? selectRef.current.getBoundingClientRect() : null;
        if ((footerRect.top - selectRect.bottom) < 68) {
            setMenuPlacement('top');
        } else {
            setMenuPlacement(props.menuPlacement || 'bottom');
        }
    }
    return (
        <span className={props.className || defaultClassName} ref={selectRef}>
            <SortableSelect
                // react-sortable-hoc props:
                axis='xy'
                onSortEnd={onSortEnd}
                distance={4}
                // small fix for https://github.com/clauderic/react-sortable-hoc/pull/352:
                getHelperDimensions={({ node }) => document.querySelector(props.containerClass || ".splitter-layout").getBoundingClientRect()}
                getContainer={() => {
                    return document.querySelector(props.containerClass || ".splitter-layout");
                }}
                styles={props.styles}
                name={props.name || ""}
                menuPortalTarget={document.querySelector(`.${defaultClassName}`)}
                helperClass='helperClass'
                classNamePrefix={"multi_select"}
                // react-select props:
                isMulti={props.isMulti}
                options={props.options}
                menuPlacement={menuPlacement}
                value={props.value}
                menuPosition='absolute'
                closeMenuOnSelect={!props.isMulti}
                closeMenuOnScroll={(e) => props.options.length < 6}
                isDisabled={props.isDisabled}
                onChange={props.onChange}
                onFocus={props.onFocus}
                onMenuOpen={getPosition}
                onMenuClose={getPosition}
                isClearable={true}
                onBlur={props.onBlur}
                components={{
                    MultiValue: SortableMultiValue,
                }}
            />
        </span>
    );
}

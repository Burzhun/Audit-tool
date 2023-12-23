import React from "react";
import { Dropdown, DropdownItem, DropdownMenu, Segment, SegmentGroup, Input, Icon, Popup } from "semantic-ui-react";
import cn from "classnames";
import { ReactSortable } from "react-sortablejs";
import "./SideSelectGroup.scss";

const DROPDOWN_VALUES = {
    SELECT_ALL: "SELECT_ALL",
    UNSELECT_ALL: "UNSELECT_ALL",
};

const dropdownOptions = [
    { text: "Select All", value: DROPDOWN_VALUES.SELECT_ALL },
    { text: "Unselect All", value: DROPDOWN_VALUES.UNSELECT_ALL },
];

class SideSelectGroup extends React.Component {
    static filterItems(items, search) {
        return search ? items.filter((item) => item.toLowerCase().includes(search.toLowerCase())) : items;
    }

    constructor(props) {
        super(props);

        this.state = {
            search: "",
            extended_field: [],
            selected_objects: [],
            object_fields: [],
            fields: props.items,
        };
        this.setSearch = this.setSearch.bind(this);
    }

    componentDidMount() {
        let fields = [];
        this.props.all_fields.forEach((item) => {
            if (this.props.all_fields.find((t) => t.includes(item + "."))) fields.push(item);
        });
        this.setState({ object_fields: fields });
    }

    onItemClick = (item) => {
        const { selection, onSelection } = this.props;
        const added = selection.includes(item);

        let newSelection = added ? [...selection.filter((v) => item !== v)] : [...selection, item];

        if (added) {
            let removed_object_fields = [];
            this.state.object_fields.forEach((f) => {
                if (item.includes(f + ".")) removed_object_fields.push(f);
            });

            newSelection = newSelection.filter((f) => !removed_object_fields.includes(f));
            const selected_objects = this.state.selected_objects.filter((f) => !removed_object_fields.includes(f));

            this.setState({ selected_objects: selected_objects });
        }

        onSelection(newSelection);
    };

    setSearch = (value) => {
        let top_field_names = [];
        this.props.items.forEach((item) => {
            if (typeof item === "string" && item.indexOf(".") > 0 && item.indexOf("@") < 0) {
                let t = item.split(".")[0];
                if (!top_field_names.includes(t)) top_field_names.push(t);
            }
        });
        this.setState({ search: value, extended_field: top_field_names });
    };

    onComplexItemClick = (item) => {
        if (!this.state.extended_field.includes(item)) {
            this.setState({ extended_field: this.state.extended_field.concat([item]) });
        } else {
            let array = this.state.extended_field;
            var index = array.indexOf(item);
            array.splice(index, 1);
            this.setState({ extended_field: array });
        }
    };

    onObjectClick = (item) => {
        if (!this.state.selected_objects.includes(item)) {
            let new_selected_objects = this.state.selected_objects.concat([item]);
            let selected = this.props.selection;
            this.props.items.forEach((it) => {
                if (it.startsWith(item + ".")) {
                    if (this.state.object_fields.includes(it)) {
                        if (!new_selected_objects.includes(it)) {
                            new_selected_objects.push(it);
                        }
                    }
                    selected.push(it);
                }
            });
            selected.push(item);
            this.setState({ selected_objects: new_selected_objects });
            this.props.onSelection(selected);
        } else {
            let array = this.state.selected_objects;
            var index = array.indexOf(item);
            array.splice(index, 1);
            this.setState({ selected_objects: array });

            let selected = this.props.selection.filter((f) => {
                if (f.startsWith(item + ".") || f === item) {
                    return false;
                }
                return true;
            });
            this.props.onSelection(selected);
        }
    };

    onDropdownItemClick = (data) => {
        const { items, selection, onSelection } = this.props;
        let newSelection;

        switch (data.value) {
            case DROPDOWN_VALUES.SELECT_ALL:
                newSelection = [...items];
                break;
            case DROPDOWN_VALUES.UNSELECT_ALL:
                newSelection = [];
                break;
            default:
                newSelection = [...selection];
        }

        onSelection(newSelection);
    };

    Sortable = (props) => (
        <ReactSortable
            list={props.items.map((item) => ({
                id: item,
                name: item,
            }))}
            setList={(sortedItems) => {
                let update = false;
                sortedItems
                    .map((item) => item && item.name)
                    .forEach((item, i) => {
                        if (item !== props.items[i]) update = true;
                    });
                if (update) props.onSort(sortedItems.map((item) => item && item.name));
            }}
            handle=".handle"
            ghostClass="drop-place"
            animation={150}
        >
            {props.children}
        </ReactSortable>
    );

    onObjectItemClick = (e, name) => {
        if (e) e.preventDefault();
        this.onObjectClick(name);
    };

    renderItems = () => {
        const { selection, onSort, items: rawItems, all_fields } = this.props;
        const { search, selected_objects } = this.state;
        const { Sortable } = this;
        let items = SideSelectGroup.filterItems(rawItems, search);
        const visiblity_page = this.props.activeConfigurationField === "Visibility";
        const isSortable = !!(onSort && !search);
        let top_field_names = [];
        let sub_keys = [];
        const orig_items = items.slice(0);
        const sub_table_names = [];
        //console.log(items);
        items.forEach((item, key) => {
            if (item["name"] && item["DefaultFieldsToDisplayInAuditSession"]) {
                item["DefaultFieldsToDisplayInAuditSession"].forEach((subField) => {
                    const new_field = item["name"] + "." + subField;
                    if (!sub_keys.includes(new_field)) sub_keys.push(new_field);
                });
            }
            if (item["name"] && item["nested_fields"]) {
                item["nested_fields"].forEach((subField) => {
                    if (subField["name"]) {
                        subField.DefaultFieldsToDisplayInAuditSession.forEach((subField2) => {
                            const table_name = item["name"] + "." + subField.name;
                            const new_field = item["name"] + "." + subField.name + "." + subField2;
                            if (!sub_table_names.includes(table_name)) sub_table_names.push(table_name);
                            if (!sub_keys.includes(new_field)) sub_keys.push(new_field);
                        });
                    } else {
                        const new_field = item["name"] + "." + subField;
                        if (!sub_keys.includes(new_field)) sub_keys.push(new_field);
                    }
                });
            }
            if (typeof item === "string") {
                const ar = item.split(".");
                if (ar.length === 3) {
                    const table_name = ar[0] + "." + ar[1];
                    if (!sub_table_names.includes(table_name)) sub_table_names.push(table_name);
                }
            }
        });

        items = items
            .filter((it) => {
                return typeof it === "string";
            })
            .concat(sub_keys);
        let complex_fields_list = items.slice(0).reduce(function (accumulator, currentValue) {
            if (typeof currentValue === "string" && currentValue.indexOf(".") > 0 && currentValue.indexOf("@") < 0) {
                let t = currentValue.split(".")[0];
                if (!top_field_names.includes(t)) {
                    top_field_names.push(t);
                }
                accumulator.push(currentValue);
            }
            return accumulator;
        }, []);
        let new_items = items.filter((it) => !complex_fields_list.includes(it) && !top_field_names.includes(it) && (!it.includes(".") || visiblity_page));
        let renderedItems = new_items.map((item) => {
            const t1 = item;
            if (!visiblity_page && all_fields && !all_fields.includes(item)) {
                const t = <span className="new">{item}</span>;
                item = <Popup data-qa="missing-item-tooltip" key={item} content="Field is not in SchemaOverviews" trigger={t} />;
            }
            return (
                <Segment
                    className={cn("select-item", {
                        selected: selection.includes(t1),
                        moved: this.props.movedFields.includes(t1) && !this.state.fields.includes(t1),
                    })}
                    vertical
                    key={t1}
                    onClick={() => this.onItemClick(t1)}
                    data-qa={selection.includes(t1) ? "item-selected" : "item-not-selected"}
                    data-qa-type="non-dict-type"
                    data-qa-value={t1}
                >
                    {isSortable && <Icon name="sort" className="handle" />}
                    {item}
                </Segment>
            );
        });

        let subfields_count_move = 0;
        top_field_names.forEach((item) => {
            let i = orig_items.filter((t) => typeof t === "string" && !t.includes(".")).indexOf(item);
            if (i < 0) i = orig_items.filter((t) => typeof t === "string" && !t.includes(".")).length;
            else i += subfields_count_move;
            let subFields = items.filter((it) => it.includes(item + ".") && !it.includes(".[]") && it.split(".").length === 2);
            items
                .filter((it) => it.startsWith(item + ".") && !it.includes(".[]") && it.split(".").length === 3)
                .forEach((it) => {
                    const t = it.split(".").slice(0, 2).join(".");
                    if (!subFields.includes(t)) subFields.push(t);
                });
            if (!subFields.length) return;
            const display = this.state.extended_field.includes(item);
            new_items.splice(i, 0, item);
            renderedItems.splice(
                i,
                0,
                <Segment
                    className={cn("select-item", {
                        selected: selected_objects.includes(item),
                    })}
                    data-qa={selected_objects.includes(item) ? "item-selected" : "item-not-selected"}
                    data-qa-type="dict-type"
                    data-qa-extended={display ? "extended" : ""}
                    data-qa-value={item}
                    onContextMenu={(e) => {
                        this.onObjectItemClick(e, item);
                    }}
                    vertical
                    key={item}
                    onClick={() => this.onComplexItemClick(item)}
                >
                    {item}
                    <Icon name={"angle " + (display ? "up" : "down")} />
                </Segment>
            );

            let j = i;
            subFields.forEach((item2) => {
                if (sub_table_names.includes(item2)) return null;
                subfields_count_move++;
                i++;
                new_items.splice(i, 0, item2);
                const t1 = item2;
                if (!visiblity_page && all_fields && !all_fields.includes(item2)) {
                    const t = <span className="new">{item2}</span>;
                    item2 = <Popup key={item2} content="Field is not in SchemeOverviews" trigger={t} />;
                }
                renderedItems.splice(
                    i,
                    0,
                    <Segment
                        className={cn("select-item", {
                            selected: selection.includes(t1),
                        })}
                        vertical
                        style={{ display: display ? "block" : "none", paddingLeft: "25px" }}
                        onClick={() => this.onItemClick(t1)}
                        key={item2}
                        data-qa={selected_objects.includes(item2) ? "item-selected" : "item-not-selected"}
                        data-qa-type="sub-field"
                        data-qa-parent={item}
                        data-qa-value={item2}
                    >
                        {isSortable && <Icon name="sort" className="handle" />}
                        {item2}
                    </Segment>
                );
            });
            //orig_items.filter()
            sub_table_names
                .filter((t) => t.includes(item + "."))
                .forEach((table_name) => {
                    i++;
                    subfields_count_move++;
                    const sub_table_fields = items.filter((it) => it.includes(table_name + ".") && !it.includes(".[]") && it.split(".").length === 3);
                    const display2 = this.state.extended_field.includes(table_name);
                    new_items.splice(i, 0, table_name);
                    renderedItems.splice(
                        i,
                        0,
                        <Segment
                            className={cn("select-item", {
                                selected: selected_objects.includes(table_name),
                            })}
                            data-qa={selected_objects.includes(table_name) ? "item-selected" : "item-not-selected"}
                            data-qa-type="dict-type"
                            data-qa-extended={this.state.extended_field.includes(table_name) ? "extended" : ""}
                            onContextMenu={(e) => {
                                this.onObjectItemClick(e, table_name);
                            }}
                            data-qa-value={table_name}
                            style={{ display: display ? "block" : "none", paddingLeft: "25px" }}
                            vertical
                            key={table_name}
                            onClick={() => this.onComplexItemClick(table_name)}
                        >
                            {table_name}
                            <Icon name={"angle " + (display2 ? "up" : "down")} />
                        </Segment>
                    );

                    sub_table_fields.forEach((item2) => {
                        i++;
                        if (!new_items.includes(item2)) new_items.splice(i, 0, item2);
                        const t2 = item2;
                        if (!visiblity_page && all_fields && !all_fields.includes(item2)) {
                            const t = <span className="new">{item2}</span>;
                            item2 = <Popup key={item2} content="Field is not in SchemeOverviews" trigger={t} />;
                        }
                        renderedItems.splice(
                            i,
                            0,
                            <Segment
                                className={cn("select-item", {
                                    selected: selection.includes(t2),
                                })}
                                vertical
                                style={{ display: display2 && display ? "block" : "none", paddingLeft: "25px" }}
                                onClick={() => this.onItemClick(t2)}
                                key={item2}
                                data-qa={selection.includes(item2) ? "item-selected" : "item-not-selected"}
                                data-qa-type="sub-field"
                                data-qa-parent={table_name}
                                data-qa-value={item2}
                            >
                                {isSortable && <Icon name="sort" className="handle" />}
                                {item2}
                            </Segment>
                        );
                    });
                });
        });
        return isSortable ? (
            <Sortable items={new_items} onSort={onSort}>
                {renderedItems}
            </Sortable>
        ) : (
            renderedItems
        );
    };

    render() {
        const { title, disabled, dataQa } = this.props;

        const { search } = this.state;

        return (
            <SegmentGroup
                className={cn("select-group", {
                    disabled,
                })}
            >
                <Segment className="select-header" textAlign="center" data-qa={`${dataQa} select-header`}>
                    <Dropdown trigger={title} selectOnBlur={false}>
                        <DropdownMenu>
                            {dropdownOptions.map((item) => (
                                <DropdownItem text={item.text} value={item.value} key={item.value} onClick={(e, data) => this.onDropdownItemClick(data)} />
                            ))}
                        </DropdownMenu>
                    </Dropdown>
                </Segment>
                <Segment className="select-search" data-qa={dataQa}>
                    <Input
                        placeholder="Search items..."
                        data-qa="search-items"
                        icon="search"
                        iconPosition="left"
                        fluid
                        value={search}
                        onChange={(e) => this.setSearch(e.target.value)}
                        action={
                            search
                                ? {
                                      icon: "close",
                                      onClick: () => this.setSearch(""),
                                  }
                                : undefined
                        }
                    />
                </Segment>
                <Segment className="select-container" data-qa={dataQa}>
                    {this.renderItems()}
                </Segment>
            </SegmentGroup>
        );
    }
}

export default SideSelectGroup;

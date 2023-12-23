function groupSubFields(fields, configuration = null) {
    const new_list = fields.filter((f) => f.indexOf(".") < 0);
    const complex_fields = configuration && configuration.ComplexFields ? configuration.ComplexFields : [];
    fields
        .filter((f) => f.indexOf(".") > 0)
        .forEach((field) => {
            const ar = field.split(".");
            const name = ar[0];
            const subField = ar[1];
            if (complex_fields.includes(name)) {
                const index = new_list.findIndex((f) => f["name"] && f["name"] === name);
                if (ar.length === 2) {
                    if (index >= 0) {
                        new_list[index]["nested_fields"].push(subField);
                    } else {
                        new_list.push({ name: name, nested_fields: [subField] });
                    }
                }
                if (ar.length === 3) {
                    if (index >= 0) {
                        const sub_index = new_list[index].nested_fields.findIndex((f) => f.name && f.name === subField);
                        if (sub_index >= 0) {
                            new_list[index].nested_fields[sub_index].DefaultFieldsToDisplayInAuditSession.push(ar[2]);
                        } else {
                            new_list[index].nested_fields.push({ name: ar[1], DefaultFieldsToDisplayInAuditSession: [ar[2]] });
                        }
                    } else {
                        new_list.push({ name: name, nested_fields: { name: subField, DefaultFieldsToDisplayInAuditSession: [ar[2]] } });
                    }
                }
            } else {
                const index = new_list.findIndex((f) => f["name"] && f["name"] === name);
                if (index >= 0) {
                    new_list[index]["DefaultFieldsToDisplayInAuditSession"].push(subField);
                } else {
                    new_list.push({ name: name, DefaultFieldsToDisplayInAuditSession: [subField] });
                }
            }
        });
    return new_list;
}

module.exports = groupSubFields;

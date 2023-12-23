import React, { useEffect, useState } from "react";
import CreatableSelect from "react-select/creatable";
import { Button, Dropdown, Grid, Input, Menu, Segment, SegmentGroup, Select } from "semantic-ui-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

let headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-access-token": localStorage.jwtToken,
    host: window.location.hostname
};

const UserPanel = (props) => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [usersType, setUsersType] = useState(null);
    const [password, setPassword] = useState("");
    const [selectedUser, setSelectedUser] = useState(null);
    const [userFields, setUserFields] = useState(null);
    const [configurations, setConfigurations] = useState([]);
    const [selectedConfigurations, setSelectedConfigurations] = useState([]);
    const [accessibleRecords, setAccessibleRecords] = useState({});
    const [filter, setFilter] = useState("");

    const [newUser, setNewUser] = useState(false);
    const [new_email, setNewEmail] = useState("");
    const [new_name, setNewName] = useState("");
    const [usertype, setUsertype] = useState("");
    const [new_surname, setSurNewName] = useState("");
    const [new_user_text, setNewUserText] = useState("");
    const [location, setLocation] = useState("");
    const [Upwork_Id, setUpwork_Id] = useState("");
    const [Upwork_Profile_Id, setUpwork_Profile_Id] = useState("");

    useEffect(() => {
        if (props.test) return;
        setUsersType("external");
    }, []);

    useEffect(() => {
        if (usersType) {
            setLoading(true);
            getUsersList();
            getDatasetsList();
        }
        setSelectedUser(null);
    }, [usersType]);

    useEffect(() => {
        setLoading(false);
    }, [users]);

    useEffect(() => {
        setPassword("");
        if (selectedUser && selectedUser.AccessableCollections) setSelectedConfigurations(selectedUser.AccessableCollections);
        if (!selectedUser) {
            setUserFields(null);
        } else {
            setNewUser(false);
            let new_fields = {};
            ["FirstName", "LastName", "Location", "Upwork_Id", "Upwork_Profile_Id"].forEach((field) => {
                new_fields[field] = selectedUser[field] || "";
            });
            new_fields.role = selectedUser.role || "internal";
            setUserFields(new_fields);
        }
    }, [selectedUser]);

    function getUsersList() {
        headers = {
            Accept: "application/json",
            "Content-Type": "application/json",
            "x-access-token": localStorage.jwtToken,
            host: window.location.hostname
        };
        let url = usersType.toLowerCase() + "Users";
        if (usersType === "manager") url = "internalUsers?manager=1";
        fetch(BACKEND_URL + "/auth/" + url, {
            method: "GET",
            headers: headers
        })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data.users) {
                    setUsers(data.users);
                }
            });
    }

    function getDatasetsList() {
        const user_type = usersType === "external" ? usersType : "internal";
        fetch(BACKEND_URL + "/configurations/collections", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ user_type: user_type })
        })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data.collections) setConfigurations(data.collections);
            });
    }

    function setNewPassword(email, password) {
        if (!password) return;
        if (password.length < 6) {
            alert("Password must have at least 6 characters");
            return;
        }
        fetch(BACKEND_URL + "/auth/resetPassword", {
            method: "POST",
            headers: headers,
            body: JSON.stringify({ email: email, new_password: password })
        })
            .then((response) => {
                return response.json();
            })
            .then((data) => {
                if (data.success) alert("Password successfully changed");
                else alert("Something went wrong");
            });
    }

    function deleteUser() {
        if (confirm("Do you want to remove this user?")) {
            fetch(BACKEND_URL + "/auth/deleteUser", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    email: selectedUser.RegisteredUserEmail
                })
            })
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    if (data.success) {
                        setSelectedUser(null);
                        getUsersList();
                        alert("User successfully removed");
                    }
                });
        }
    }

    function save() {
        if (selectedUser && selectedConfigurations.length) {
            fetch(BACKEND_URL + "/auth/setExternalUserRecords", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    email: selectedUser.RegisteredUserEmail,
                    data: selectedConfigurations
                })
            })
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    if (data.success) alert("Successfully updated");
                });
        }
        // props.updateConfg({data:accessibleRecords, field:'AccessibleRecords', activeCollection:props.collection});
    }

    function setUserField(value, field) {
        let new_fields = Object.assign({}, userFields);
        new_fields[field] = value;
        setUserFields(new_fields);
    }

    function updateUserFields() {
        if (selectedUser && userFields) {
            fetch(BACKEND_URL + "/auth/updateUserFields", {
                method: "POST",
                headers: headers,
                body: JSON.stringify({
                    email: selectedUser.RegisteredUserEmail,
                    data: userFields
                })
            })
                .then((response) => {
                    return response.json();
                })
                .then((data) => {
                    if (data.success) alert("Successfully updated");
                    getUsersList();
                    setSelectedUser(null);
                });
        }
    }

    function createUser() {
        setNewUserText("");
        if (usertype === "") {
            setNewUserText("Set user type");
            return;
        }
        document.getElementById("new_email_value").type = "email";
        if (document.getElementById("new_email_value").validity.valid && new_email != "") {
            fetch(`${BACKEND_URL}/auth/createUser`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    email: new_email,
                    first_name: new_name,
                    last_name: new_surname,
                    usertype,
                    location,
                    Upwork_Id,
                    Upwork_Profile_Id
                })
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.success) {
                        setNewUserText(`New User account was created. Email:${data.email} , Password:${data.password}`);
                    } else {
                        if (data.status === "USER_EXISTS") setNewUserText("User already exists");
                        else setNewUserText("User creating failed");
                    }
                });
        } else {
            setNewUserText("Email is incorrect");
        }
    }

    const recordIds = (selectedUser && accessibleRecords[selectedUser.RegisteredUserEmail]) || [];
    const accessAll = (selectedUser && accessibleRecords[selectedUser.RegisteredUserEmail] && accessibleRecords[selectedUser.RegisteredUserEmail].includes("all")) || false;

    const role = props.user.role;
    return (
        <React.Fragment>
            <SegmentGroup>
                <Segment textAlign='center' style={{ width: "100%" }}>
                    Set Accessable Collections and User Passwords
                </Segment>
                <Segment>
                    <Grid relaxed='very' columns='equal'>
                        <Grid.Column>
                            <Menu secondary>
                                <Menu.Item
                                    data-qa='external-users'
                                    name='External Users'
                                    active={usersType === "external"}
                                    onClick={() => {
                                        setUsersType("external");
                                    }}
                                />
                                {role === "Admin" && (
                                    <React.Fragment>
                                        <Menu.Item
                                            data-qa='internal-users'
                                            name='Internal Users'
                                            active={usersType === "Internal"}
                                            onClick={() => {
                                                setUsersType("Internal");
                                            }}
                                        />
                                        <Menu.Item
                                            name='Admin Users'
                                            data-qa='admin-users'
                                            active={usersType === "Admin"}
                                            onClick={() => {
                                                setUsersType("Admin");
                                            }}
                                        />
                                        <Menu.Item
                                            name='Manager'
                                            data-qa='manager'
                                            active={usersType === "manager"}
                                            onClick={() => {
                                                setUsersType("manager");
                                            }}
                                        />
                                    </React.Fragment>
                                )}
                                <Menu.Item
                                    name='New User'
                                    data-qa='new-user'
                                    active={newUser}
                                    onClick={() => {
                                        setNewUser(true);
                                        setUsersType(null);
                                        setUsers([]);
                                    }}
                                />
                            </Menu>
                            <div>
                                <Input
                                    value={filter}
                                    onChange={(e, data) => {
                                        setFilter(data.value);
                                    }}
                                    style={{ margin: " 4px 0", width: "100%" }}
                                />
                            </div>
                            <div className='validators-container fields-list' data-qa='external-users-list'>
                                {!loading &&
                                    (filter ? users.filter((user) => user.RegisteredUserEmail.includes(filter)) : users).map((user) => (
                                        <div
                                            data-qa={user.RegisteredUserEmail}
                                            key={user._id}
                                            onClick={() => setSelectedUser(user)}
                                            className={selectedUser && selectedUser.RegisteredUserEmail === user.RegisteredUserEmail ? "selected" : "user_row"}
                                        >
                                            {user.RegisteredUserEmail}
                                        </div>
                                    ))}
                            </div>
                        </Grid.Column>
                        <Grid.Column width={9}>
                            {newUser && (role === "Admin" || role === "Manager") && (
                                <div style={{ marginLeft: "110px" }}>
                                    <div>Generate new user account</div>
                                    <div className='profile_form_row'>
                                        <Input
                                            style={{ verticalAlign: "top" }}
                                            placeholder='Email'
                                            type='email'
                                            id='new_email_value'
                                            value={new_email}
                                            onChange={(e, data) => setNewEmail(data.value)}
                                        />
                                        <Select
                                            data-qa='user-type'
                                            placeholder='User type'
                                            options={(role == "Admin" ? ["Internal", "External", "Manager", "Admin"] : ["External"]).map((f) => ({
                                                text: f,
                                                value: f,
                                                "data-qa": f
                                            }))}
                                            value={usertype}
                                            onChange={(e, data) => setUsertype(data.value)}
                                            style={{ marginLeft: "10px" }}
                                        />
                                    </div>
                                    <div className='profile_form_row'>
                                        <Input data-qa='FirstName' placeholder='First Name' value={new_name} onChange={(e, data) => setNewName(data.value)} />
                                        <Input
                                            data-qa='LastName'
                                            placeholder='Last Name'
                                            style={{ marginLeft: "10px" }}
                                            value={new_surname}
                                            onChange={(e, data) => setSurNewName(data.value)}
                                        />
                                    </div>
                                    <div className='profile_form_row'>
                                        <Input data-qa='Location' placeholder='Location' value={location} onChange={(e, data) => setLocation(data.value)} />
                                    </div>
                                    <div className='profile_form_row'>
                                        <Input data-qa='Upwork_Id' placeholder='Upwork_Id' value={Upwork_Id} onChange={(e, data) => setUpwork_Id(data.value)} />
                                    </div>
                                    <div className='profile_form_row'>
                                        <Input
                                            data-qa='Upwork_Profile_Id'
                                            placeholder='Upwork_Profile_Id'
                                            value={Upwork_Profile_Id}
                                            onChange={(e, data) => setUpwork_Profile_Id(data.value)}
                                        />
                                    </div>
                                    <div className='profile_form_row'>
                                        <Button data-qa='generate' onClick={() => createUser()}>
                                            Generate
                                        </Button>
                                    </div>
                                    {new_user_text && <div data-qa='new-user-created'>{new_user_text}</div>}
                                </div>
                            )}
                            {!newUser && (
                                <div className='validators-container values-list' data-qa='validators-values'>
                                    {selectedUser && selectedUser.role !== "Admin" && (
                                        <div className='user_panel_row' style={{ overflow: "visible", paddingBottom: "50px" }}>
                                            <div>Datasets that can loaded by users</div>
                                            <CreatableSelect
                                                isMulti
                                                isDisabled={accessAll}
                                                className=''
                                                styles={{ width: "300px" }}
                                                value={selectedConfigurations
                                                    .filter((f) => f !== "all")
                                                    .map((f) => ({
                                                        value: f.toString(),
                                                        label: f.toString()
                                                    }))}
                                                onChange={(values, m) => setSelectedConfigurations(values ? values.map((v) => v.label) : [])}
                                                options={configurations.map((item) => ({
                                                    label: item,
                                                    value: item
                                                }))}
                                            />
                                            <Button
                                                data-qa='save-btn'
                                                onClick={() => {
                                                    save();
                                                }}
                                                style={{ float: "right" }}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    )}
                                    {selectedUser && usersType === "external" && selectedUser.role !== "Admin" && (
                                        <div className='user_panel_row'>
                                            <div className='user_panel_row'>
                                                <div data-qa='reset-password'>Reset password</div>
                                                <Input data-qa='password-input' style={{ width: "300px" }} value={password} onChange={(e, data) => setPassword(data.value)} />{" "}
                                                <br />
                                                <Button
                                                    data-qa='save-password'
                                                    onClick={() => {
                                                        setNewPassword(selectedUser.RegisteredUserEmail, password);
                                                    }}
                                                    style={{ marginLeft: "20px" }}
                                                >
                                                    Save Password
                                                </Button>
                                            </div>
                                            <Button data-qa='delete-user' style={{ float: "right" }} onClick={() => deleteUser()}>
                                                Remove user
                                            </Button>
                                        </div>
                                    )}

                                    {selectedUser && ["Internal", "manager"].includes(usersType) && selectedUser.role !== "Admin" && (
                                        <div className='user_panel_row'>
                                            <div>
                                                <div>Reset password</div>
                                                <Input style={{ width: "300px" }} value={password} onChange={(e, data) => setPassword(data.value)} /> <br />
                                            </div>
                                            <Button
                                                data-qa='save-password'
                                                onClick={() => {
                                                    setNewPassword(selectedUser.RegisteredUserEmail, password);
                                                }}
                                                style={{ marginLeft: "20px" }}
                                            >
                                                Save
                                            </Button>
                                            <Button data-qa='delete-user' style={{ float: "right" }} onClick={() => deleteUser()}>
                                                Remove user
                                            </Button>
                                        </div>
                                    )}
                                    {selectedUser && (role === "Admin" || (role === "Manager" && selectedUser.role === "external")) && (
                                        <div className='user_panel_row'>
                                            <div>
                                                <div>Update Fields</div>
                                                {role === "Admin" && (
                                                    <div>
                                                        <span
                                                            style={{
                                                                marginRight: "10px"
                                                            }}
                                                        >
                                                            Role{" "}
                                                        </span>
                                                        <Dropdown
                                                            className='dropdown-collection'
                                                            placeholder='Select Role'
                                                            selection
                                                            selectOnBlur={false}
                                                            data-qa='select-role'
                                                            options={["Admin", "internal", "external", "Manager"].map((item) => ({
                                                                text: item,
                                                                value: item
                                                            }))}
                                                            onChange={(e, data) => setUserField(data.value, "role")}
                                                            value={userFields ? userFields["role"] || "internal" : "internal"}
                                                        />
                                                    </div>
                                                )}
                                                {["FirstName", "LastName", "Location"]
                                                    .concat(selectedUser.role === "external" ? ["Upwork_Id", "Upwork_Profile_Id"] : [])
                                                    .map((field) => (
                                                        <div>
                                                            {field}{" "}
                                                            <Input
                                                                data-qa={field}
                                                                style={{
                                                                    width: "300px"
                                                                }}
                                                                value={userFields ? userFields[field] || "" : ""}
                                                                onChange={(e, data) => setUserField(data.value, field)}
                                                            />{" "}
                                                        </div>
                                                    ))}
                                            </div>
                                            <Button style={{ float: "right" }} onClick={() => updateUserFields()}>
                                                Update fields
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </Grid.Column>
                    </Grid>
                </Segment>
            </SegmentGroup>
        </React.Fragment>
    );
};

export default UserPanel;

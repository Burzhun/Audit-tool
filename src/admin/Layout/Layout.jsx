import React from 'react';
import './Layout.scss';
import {Container} from 'semantic-ui-react';
import Dashboard from '../Dashboard/Dashboard';
import UserPanel from '../UserPanel/UserPanel';
import setAuthToken from '../../utils/setAuthToken';

const {PUBLIC_URL} = process.env;
const prod = process.env.REACT_APP_PROD;

function Layout(props) {
    const [userName, setUserName] = React.useState('');
    const [revision, setRevision] = React.useState('');
    const staging = prod === '1' ? '' : 'staging';

    function logout() {
        localStorage.removeItem('jwtToken');
        setAuthToken(false);
        document.location = '/auth-login';
    }

    const username = props.user.first_name + ' ' + props.user.last_name
    return (
        <div className="layout">
            <div className={`main-header ${staging}`}>
                <div className="header-container">
                    <div className="header-left-group">
                        <div alt="logo" className="logo"></div>
                    </div>
                    <div className="header-right-group">
                        <a href='/profile' className="header-item">
                            {username &&
                            <i className="user icon"/>}
                            {username}

                        </a>
                        {props.page === 'users' && props.user.role === 'Admin' &&
                        <a href='/admin' className="header-item portal-link">
                            <i className="external icon"/>
                            Admin panel
                        </a>}

                        <a href='/users' className="header-item portal-link">
                            <i className="external icon"/>
                            Users
                        </a>
                        {props.user.role === 'Admin' && <a href='/dashboard' className="header-item portal-link">
                            <i className="external icon"/>
                            Portal
                        </a>}
                        <span data-qa="logout" className="header-item menuLink" onClick={() => {
                            logout()
                        }}>
              <i className="sign-out icon"/>
              Logout
            </span>
                    </div>
                </div>
            </div>
            <div className="content">
                <Container className="main_page_container">
                    {props.page === 'admin' &&
                    <Dashboard setUserName={setUserName} user={props.user} setRevision={setRevision}/>}
                    {props.page === 'users' &&
                    <UserPanel setUserName={setUserName} user={props.user} setRevision={setRevision}/>}
                </Container>
            </div>
            {revision && <div data-qa="revision" style={{
                position: 'sticky',
                top: '100%',
                fontSize: 'smaller',
                marginLeft: '300px'
            }}>revision: {revision}</div>}
        </div>
    );
}

export default Layout;

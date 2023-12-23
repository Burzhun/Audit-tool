import React from 'react';
import './Layout.scss';
import {Container} from 'semantic-ui-react';
import Dashboard from '../Dashboard/Dashboard';

const {PUBLIC_URL} = process.env;

function Layout(props) {
    const [userName, setUserName] = React.useState('');
    return (
        <div className="layout">
            <div className="main-header">
                <div className="header-container">
                    <div className="header-left-group">
                        <img alt="logo" className="logo" src={`${PUBLIC_URL}/images/fxc_logo.svg`}/>
                    </div>
                    <div className="header-right-group">
            <span className="header-item">
              {userName &&
              <i className="user icon"/>}
                {userName}
            
            </span>
                        <span className="header-item">
              <i className="external icon"/>
              Portal
            </span>
                        <span data-qa="logout" className="header-item">
              <i className="sign-out icon"/>
              Logout
            </span>
                    </div>
                </div>
            </div>
            <div className="content">
                <Container className="main_page_container">
                    <Dashboard setUserName={setUserName}/>
                </Container>
            </div>
        </div>
    );
}

export default Layout;

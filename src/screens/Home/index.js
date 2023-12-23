import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Button } from 'semantic-ui-react';

const Home = (props)=> {  

  function gotoDashboard() {
    if (props.isAuthenticated) { props.history.push('/dashboard'); } else { props.history.push('/auth-login'); }
  }
  
  return (
    <div className="container">
      <h1> Welcome </h1>
      <Button className="green authBtn" onClick={gotoDashboard}>Go To Dashboard</Button>
    </div>
  );
  
}

const mapStateToProps = (state) => ({
  isAuthenticated: state.authReducer.isAuthenticated,
});

const mapDispatchToProps = (dispatch) => ({

});

export default connect(mapStateToProps, mapDispatchToProps)(Home);

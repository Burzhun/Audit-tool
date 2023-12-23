# Audit Tool Admin Frontend App

## Local server setup

### Prerequisites
* `NodeJS` >= v12
* `Yarn` latest version
* Running backend admin app

### Steps to run server

1. Setup environment variables

    Create `.env` file in project root with env variables needed to run server:
    
    ```dotenv
    SKIP_PREFLIGHT_CHECK=true # service parameter
    REACT_APP_API_URL=http://localhost:9000 # backend app url
    ``` 
    
    There's `.env.example` file in project root which can be used to find out which
    environment variables needed to run app.
    
2. Run `yarn install` to install all dependencies.
3. Run `yarn start` to start server with automatic reload on codebase changes. 

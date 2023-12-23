# Audit Tool Admin Backend App

## Local server setup

### Prerequisites
* `NodeJS` >= v12
* `Yarn` latest version
* `MongoDB` - audit database uses v3.6

### Steps to run server

1. Setup environment variables

    Create `.env` file in project root with env variables needed to run server:
    
    ```dotenv
    PORT=9000 # app port
    DB_URI=mongodb://localhost:27017 # mongodb url to connect to
    DB_NAME=cards # database name
    DB_USERNAME= # database username
    DB_PASSWORD= # database password
    ``` 
    
    There's `.env.example` file in project root which can be used to find out which
    environment variables needed to run app.
    
2. Run `yarn install` to install all dependencies.
3. Run `yarn nodemon` to start server with automatic reload on codebase changes. 

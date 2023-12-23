


## Features Out-Of-The-Box

* React-Router 4
* Semantic Ui
* Redux
* Redux Saga
* ESlint
* Express.js
* Postgres



## Installation

Clone repo and run:

```
yarn && yarn start
```

## Deployment Instruction

- Open Ports For Frontend, Backend and Postgre

Ports
Frontend: Custom TCP 3000
Backend: Custom TCP 4000
Postgre: Custom TCP 5432

- Server file structure

	copy https://github.com/andresrodrigu/product_app/tree/master/server to home/ubuntu/backend/
	copy https://github.com/andresrodrigu/product_app (except 'server' folder) to home/ubuntu/frontend/

- Change Server address

	replace your server IP address to

	server/.env
	sr/lib/api.js line 2
- SSH Access to AWS ec2 instance
  Type this command in your Terminal
  ```console
  ssh -i "test-instance.pem" ubuntu@34.244.171.130
  ```
- Install Nginx Server

  Reference: https://phoenixnap.com/kb/install-nginx-on-ubuntu
  ```console
  sudo apt-get install nginx -y
  sudo service nginx start
  ```
- Install nodejs and npm on the Server
  
  Reference: https://linuxize.com/post/how-to-install-node-js-on-ubuntu-18.04/

- Install nodejs pm2
```console
  sudo npm install pm2 -g
  ```
- Run Frontend and Backend with pm2 command
  In the project folder
	
	go to home/ubuntu/frontend/ and run
    ```console
    sudo pm2 start node_modules/react-scripts/scripts/start.js --name "fronte" (Frontend)
    ```
	
	go to home/ubuntu/backend/ and run
	```console
	sudo pm2 start app.js (Backend)
    ```
- Redirect default 80 port to 3000(frontend)
  Edit nginx configuration file
  open file:
  ```console
  sudo nano /etc/nginx/sites-available/default
  ```
  Remove all and paste the following
  ```nginx
  server {
        listen 80 default_server;
        location /{
                proxy_pass      http://127.0.0.1:3000;
        }
  }
  ```
- Restart nginx server

```console
  sudo service nginx restart
```
  
## Build and run production version of the frontend

- Build by command:
```
npm run build
```
- If serve tool not installed install it:

```
npm install serve
``` 

- Start app
```
serve -s build -l 3000
```

## Add revision number

To show revision number in the frontend there is a pre-commit hook in the repo.
Each developer, working on the project should add this hook to his repository by following:

1. Copy pre-commit to .git/hooks/pre-commit
2. Make:
```
chmod +x .git/hooks/pre-commit
```

This will automatically set commit numbers as revision number 


## Repository structure
Frontend:
  /public
  /src
Backend:
  /server
Docker:
  /scripts
Tests:
  /tests

Search result screen:
  /src/screens/Dashboard/index.js
  /src/screens/Dashboard/configSelector.js
  /src/screens/Dashboard/AddFieldSelector.js
  /src/screens/Dashboard/addRecordButton.js
  /src/screens/Dashboard/SearchFilter.js
  /src/screens/Dashboard/SearchFilterList.js
  /src/screens/Dashboard/Table.jsx
  /src/screens/Dashboard/Header.jsx
Audit session screen
  /src/screens/Detail/index.js
  /src/screens/Detail/components/*
Redux sagas
  /src/sagas/watchers/getData.js
  /src/sagas/watchers/userSaga.js
  /src/sagas/index.js
Redux reducers
  /src/reducers/auth.js
  /src/reducers/data.js
  /src/reducers/index.js
Redux actions
  /src/actions/index.js
Fetch Requests
  /src/lib/api.js
Validators
  /src/validators.js
ResizableBox Custom component
  /src/components/resizableBox/*
Login
  /src/components/auth/login.js
Register
  /src/components/auth/register.js

##[Data Validation](validators.md)
##[QA instruction](qa.md)

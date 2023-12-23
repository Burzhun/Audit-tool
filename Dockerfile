FROM node:15
WORKDIR /opt/app
COPY .env /opt/app/server/.env
COPY .env /opt/app/tests/.env
COPY .env /opt/app/.env
RUN echo "#!/bin/bash\n" \
         "npm run test\n" > /opt/app/script.sh
RUN chmod +x /opt/app/script.sh
RUN mkdir ~/.ssh/
RUN ssh-keyscan -H git.fxcompared.com >> ~/.ssh/known_hosts

# Install app dependencies
COPY tests/package.json tests/package-lock.json /opt/app/tests/
#RUN cd /opt/app/tests && npm i
##
COPY server/package.json server/package-lock.json /opt/app/server/
RUN cd /opt/app/server && npm ci --legacy-peer-deps
##
ADD server /opt/app/server
ADD tests /opt/app/tests
WORKDIR /opt/app/tests

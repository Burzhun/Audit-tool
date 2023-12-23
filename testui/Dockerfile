FROM python:3.8

ADD ./ /opt/app

WORKDIR /opt/app
RUN /usr/local/bin/python -m pip install --upgrade pip
RUN pip install -r requirements.txt
RUN apt-get update
RUN apt-get install -y jq
RUN chmod +x ./wait-for-it.sh
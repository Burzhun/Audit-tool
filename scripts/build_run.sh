#!/bin/bash

/usr/bin/docker-compose build
/usr/bin/docker-compose down
/usr/bin/docker-compose up -d

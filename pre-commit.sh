#!/bin/bash

git log develop --pretty=oneline | wc -l | xargs -I x echo x > ./server/build_number
git add ./server/build_number

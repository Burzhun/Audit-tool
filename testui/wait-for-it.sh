#!/bin/bash
# wait-for-grid.sh
HUB=$(grep HUB_HOST .env | cut -d '=' -f2)
echo "http://${HUB}:4444/wd/hub/status"
set -e

cmd="$@"

while ! curl -sSL "http://${HUB}:4444/wd/hub/status" 2>&1 |
  jq -r '.value.ready' 2>&1 | grep "true" >/dev/null; do
  echo 'Waiting for the Grid'
  sleep 1
done

echo >&2 "Selenium Grid is up - executing test"
exec $cmd

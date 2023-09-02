#!/bin/bash
set -e

function setup {
  npm ci
  npm start &> '/dev/null' &
  git clone https://github.com/solid-contrib/solid-crud-tests.git
  cd solid-crud-tests
  git fetch origin
  git checkout nss-skips
  git pull
  npm ci
  cd ..
  git clone https://github.com/solid-contrib/web-access-control-tests.git
  cd  web-access-control-tests
  #git fetch origin
  #git checkout run-against-css
  git pull
  npm ci
  cd ..
}

function waitForCss {
  until curl -kI http://localhost:3000 2> /dev/null
  do
    echo Waiting for CSS to start, this can take up to a minute ...
    sleep 1
  done
}

function teardown {
  kill $(lsof -t -i :3000)
  rm -rf solid-crud-tests web-access-control-tests
}

function runTests {
  cd $1
  ./run-against-css.sh
  cd ..
}

# ...
teardown || true
setup
waitForCss
runTests solid-crud-tests
runTests web-access-control-tests
teardown


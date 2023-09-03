#!/bin/bash
set -e

export SKIP_CONC=1

function setup {
  npm ci
  rm node_modules/@solid/access-token-verifier/dist/algorithm/verifySolidAccessTokenIssuer.js
  cp test/surface/verifySolidAccessTokenIssuer.js node_modules/@solid/access-token-verifier/dist/algorithm/verifySolidAccessTokenIssuer.js
  npm start -- --detectOpenHandles &> '/dev/null' &
  git clone https://github.com/solid-contrib/solid-crud-tests.git
  cd solid-crud-tests
  git checkout css-skips
  npm ci
  cd ..
  git clone https://github.com/solid-contrib/web-access-control-tests.git
  cd  web-access-control-tests
  #git fetch origin
  #git checkout run-against-css
  git pull
  npm ci
  rm run-against-css.sh
  cp ../test/surface/web-access-control-tests.sh run-against-css.sh
  chmod +x run-against-css.sh
  cd ..
}

function waitForCss {
  until curl -kI http://localhost:$1 2> /dev/null
  do
    echo Waiting for CSS to start on port $1, this can take up to a minute ...
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
waitForCss 3000
runTests solid-crud-tests
runTests web-access-control-tests
teardown


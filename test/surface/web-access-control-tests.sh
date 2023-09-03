#!/bin/bash
set -e

# npm ci

export SYSTEM_UNDER_TEST=http://localhost:3000
export HELP_SERVER_HOST=solidcommunity.net

export OIDC_ISSUER_ALICE=https://$HELP_SERVER_HOST
export USERNAME_ALICE=solidtestsuite
export PASSWORD_ALICE=Testing123
export WEBID_ALICE=https://$USERNAME_ALICE.$HELP_SERVER_HOST/profile/card#me

export OIDC_ISSUER_BOB=https://solidcommunity.net
export USERNAME_BOB=solid-crud-tests-example-2
export PASSWORD_BOB=123
export WEBID_BOB=https://$USERNAME_BOB.$HELP_SERVER_HOST/profile/card#me

export RESULTS_PATH=../test-suite/CSS/wac-results.json

echo Automated way to get an OIDC issuer cookie for Alice:
export CURL_RESULT_ALICE=`curl -ki $OIDC_ISSUER_ALICE/login/password -d"username=$USERNAME_ALICE&password=$PASSWORD_ALICE" | grep Set-Cookie`
export COOKIE_ALICE=`expr "$CURL_RESULT_ALICE" : '^Set-Cookie:\ \(.*\).'`

echo Other env vars for Alice:

echo Automated way to get an OIDC issuer cookie for Bob:
export CURL_RESULT_BOB=`curl -ki $OIDC_ISSUER_BOB/login/password -d"username=$USERNAME_BOB&password=$PASSWORD_BOB" | grep Set-Cookie`
export COOKIE_BOB=`expr "$CURL_RESULT_BOB" : '^Set-Cookie:\ \(.*\).'`

echo Running with these values for Alice:
echo Cookie: $COOKIE_ALICE
echo OIDC issuer: $OIDC_ISSUER_ALICE
echo WebID: $WEBID_ALICE

echo Running with these values for Bob:
echo Cookie: $COOKIE_BOB
echo OIDC issuer: $OIDC_ISSUER_BOB
echo WebID: $WEBID_BOB

echo Setting root acl in system under test:
echo "@prefix acl: <http://www.w3.org/ns/auth/acl#>. <#alice> a acl:Authorization ; acl:agent <$WEBID_ALICE> ; acl:accessTo </>; acl:default </>; acl:mode acl:Read, acl:Write, acl:Control ." > root-acl.ttl
curl -v -X PUT -H 'Content-Type: text/turtle' -T root-acl.ttl $SYSTEM_UNDER_TEST/.acl
export NODE_TLS_REJECT_UNAUTHORIZED=0

export STORAGE_ROOT_ALICE=$SYSTEM_UNDER_TEST/


# npm run jest "$@"
# DEBUG=*
export INCLUDE_MAY=1
mkdir -p ../test-suite/CSS
npm run jest -- --verbose --json --outputFile="$RESULTS_PATH" "$@"

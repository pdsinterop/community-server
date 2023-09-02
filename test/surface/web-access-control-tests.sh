#!/bin/bash
set -e

export WEBID_ALICE=http://localhost:3000/profile/card#me
export OIDC_ISSUER_ALICE=http://localhost:3000
export STORAGE_ROOT_ALICE=http://localhost:3000/
export WEBID_BOB=http://localhost:30001/profile/card#me
export OIDC_ISSUER_BOB=http://localhost:30001
export STORAGE_ROOT_BOB=http://localhost:30001/


# npm run jest "$@"
# DEBUG=*
export INCLUDE_MAY=1
npm run jest 

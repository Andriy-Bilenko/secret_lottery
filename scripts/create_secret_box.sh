#!/bin/bash

#
# Adapted from: https://github.com/scrtlabs/snip20-reference-impl/blob/master/tests/integration.sh
# This script is used by Gitpod or other compatible remote development environment (see .gitpod.yml)
# to interact with the running LocalSecret instance to deploy a secret contract.
#

set -e
set -o pipefail # If anything in a pipeline fails, the pipe's exit status is a failure
#set -x # Print all commands for debugging

# Check if exactly one argument is provided
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <wallet name> <0 if local 1 if testnet>" # testnet_kepl_wallet1
    exit 1
fi

export WALLET_NAME=$1
export is_testnet=$2

if [ "$is_testnet" == "0" ]; then
    export LOCALSECRET_LCD="http://localhost:1317" # local
    export CHAIN_ID="secretdev-1"

else
    export LOCALSECRET_LCD="https://lcd.testnet.secretsaturn.net" # testnet, LCD from Pulsator 3
    export CHAIN_ID="pulsar-3"
fi

# Just like `echo`, but prints to stderr
function log() {
    echo -e "$@" >&2
}

# suppress all output to stdout for the command described in the arguments
function quiet() {
    "$@" >/dev/null
}

# Generate a label for a contract with a given code id
# This just adds "contract_" before the code id.
function label_by_id() {
    local id="$1"
    echo "contract_$id"
}

# Keep polling the blockchain until the tx completes.
# The first argument is the tx hash.
# The second argument is a message that will be logged after every failed attempt.
# The tx information will be returned.
function wait_for_tx() {
    local tx_hash="$1"

    local result

    log "waiting on tx: $tx_hash"
    # secretcli will only print to stdout when it succeeds
    until result="$(secretcli query tx "$tx_hash" 2>/dev/null)"; do
        sleep 1
    done

    # log out-of-gas events
    if quiet jq -e '.raw_log | startswith("execute contract failed: Out of gas: ") or startswith("out of gas:")' <<<"$result"; then
        log "$(jq -r '.raw_log' <<<"$result")"
    fi

    echo "$result"
}

# Extract the tx_hash from the output of the command
function tx_of() {
    "$@" | jq -r '.txhash'
}

# function create_new_wallet_and_fund() {
#     # Use expect to handle the prompt
#     expect <<EOF
#     spawn secretcli keys add $WALLET_NAME
#     # expect "override the existing name a \[y/N\]:"
#     send "n\r"
#     expect eof
# EOF
#     addr=$(secretcli keys show --address $WALLET_NAME)
#     # mnemonic=$(secretcli keys export $WALLET_NAME)
#     log "created wallet $WALLET_NAME with address $addr and mnemonic: "
#     log "funding..."
#     curl "http://localhost:5000/faucet?address=$addr"
#     sleep 3
#     log "\nfunded:    "
#     secretcli query bank balances $(secretcli keys show --address $WALLET_NAME)
#     log "\n"
# }

function upload_contract() {
    log "=== uploading the contract..."
    set -e
    local directory="$1"
    local tx_hash
    local code_id

    # tx_hash="$(tx_of secretcli tx compute store "contract.wasm.gz" ${FROM[a]} --gas 10000000 )" # code/$directory/
    tx_hash="$(tx_of secretcli tx compute store "contract.wasm.gz" --gas 5000000 --from $(secretcli keys show --address $WALLET_NAME) -y)"
    code_id="$(
        wait_for_tx "$tx_hash" 'waiting for contract upload' |
            jq -r '.logs[0].events[0].attributes[] | select(.key == "code_id") | .value'
    )"

    log "uploaded contract"

    echo "$code_id"
}

function query_contract_hash() {
    set -e
    local code_id="$1"

    code_hash="$(secretcli query compute contract-hash-by-id "$code_id")" || return
    log "got contract hash"
    echo "$code_hash"
}

function instantiate() {
    log "\n=== instantiating the contract..."
    set -e
    local code_id="$1"
    local init_msg="$2"

    log 'sending init message: \c'
    log "${init_msg@Q}"

    local tx_hash
    tx_hash="$(tx_of secretcli tx compute instantiate "$code_id" "$init_msg" --label "$(label_by_id "$code_id")" --gas 10000000 --from $(secretcli keys show --address $WALLET_NAME) -y)"
    wait_for_tx "$tx_hash" 'waiting for init to complete'
}

# This function uploads and instantiates a contract, and returns the new contract's address
function create_contract() {
    set -e
    local init_msg="$1"
    local code_id="$2"

    local init_result
    init_result="$(instantiate "$code_id" "$init_msg")"

    if quiet jq -e '.logs == null' <<<"$init_result"; then
        log "$(secretcli query compute tx "$(jq -r '.txhash' <<<"$init_result")")"
        return 1
    fi

    jq -r '.logs[0].events[0].attributes[] | select(.key == "contract_address") | .value' <<<"$init_result"
}

# if [ "$LOCALSECRET_LCD" == "" ]; then
#     LOCALSECRET_LCD='http://localhost:1317'
# fi

function main() {
    log '              <####> Create Secret Box contract <####>'
    log "secretcli version in the docker image is: $(secretcli version)\n"

    localsecret_lcd=$LOCALSECRET_LCD
    log -e "LocalSecret URL: $localsecret_lcd\n"

    log "=== setting up the wallet..."
    # create_new_wallet_and_fund

    local init_msg
    init_msg='{"count": 16876}'
    code_id="$(upload_contract '.')"
    contract_hash="$(query_contract_hash "$code_id")"
    contract_addr="$(create_contract "$init_msg" "$code_id")"

    log '\nDone.\n'

    log "secret code id: $code_id"
    log "secret contract address: $contract_addr"
    log -e "secret contract code hash: $contract_hash\n"

    log 'Storing env variables...'
    echo -e "CHAIN_ID=$CHAIN_ID\nSECRET_BOX_CODE=$code_id\nSECRET_BOX_ADDRESS=$contract_addr\nSECRET_BOX_HASH=$contract_hash\nLOCALSECRET_LCD=$localsecret_lcd" >.env
    echo -e "VITE_CHAIN_ID=$CHAIN_ID\nVITE_SECRET_BOX_CODE=$code_id\nVITE_SECRET_BOX_ADDRESS=$contract_addr\nVITE_SECRET_BOX_HASH=$contract_hash\nVITE_LOCALSECRET_LCD=$localsecret_lcd" >app/.env
    echo -e "CHAIN_ID=$CHAIN_ID\nSECRET_BOX_CODE=$code_id\nSECRET_BOX_ADDRESS=$contract_addr\nSECRET_BOX_HASH=$contract_hash\nLOCALSECRET_LCD=$localsecret_lcd" >tests/.env
    echo -e "set CHAIN_ID $CHAIN_ID\nset SECRET_BOX_CODE $code_id\nset SECRET_BOX_ADDRESS $contract_addr\nset SECRET_BOX_HASH $contract_hash\nset LOCALSECRET_LCD $localsecret_lcd" >.env.fish       # for fish shell
    echo -e "set CHAIN_ID $CHAIN_ID\nset SECRET_BOX_CODE $code_id\nset SECRET_BOX_ADDRESS $contract_addr\nset SECRET_BOX_HASH $contract_hash\nset LOCALSECRET_LCD $localsecret_lcd" >tests/.env.fish # for fish shell
    log 'Done.\n'

    log "Use 'source .env' to set the SECRET BOX environment variables in your local bash shell"
    log 'Returning environment variables for workspace'
    # If everything else worked, return successful status
    echo "SECRET_BOX_CODE=$code_id SECRET_BOX_ADDRESS=$contract_addr SECRET_BOX_HASH=$contract_hash LOCALSECRET_LCD=$localsecret_lcd"

    return 0
}

main "$@"

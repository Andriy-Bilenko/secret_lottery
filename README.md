# upload and instantiate

(doing that only locally at the momment)
`./scripts/create_secret_box.sh a 0`
or if something fails decompose:

```bash
# build
make build
# store
secretcli tx compute store contract.wasm.gz --gas 5000000 --from a --chain-id secretdev-1 -y
# check
secretcli query compute list-code
# instantiate
secretcli tx compute instantiate 6 '{"participation_fee_uscrt": "1000"}' --from a --label CTR6 -y
# check
secretcli query compute list-contract-by-code 6
```

# commands to interact with the contract

```bash
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"get_num_of_participants": {}}'
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"get_last_winner": {}}'
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"get_all_participants": {}}'
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"get_participation_fee": {}}'
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"did_i_participate": {"address": "secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03"}}'

secretcli tx compute execute secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"participate": {}}' --from a --amount 1000000uscrt -y
secretcli tx compute execute secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"end_lottery": {}}' --from a -y
```

# additional commands

```bash
# view balance
secretcli query bank balances $(secretcli keys show --address a)
# or
secretcli query bank balances secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t
```

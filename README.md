> [!IMPORTANT]
> currently using `secretcli 1.15.0-beta.7` and `secretjs@1.15.0-beta.0`
## First setup
clone the repo, then:
- `mv .env.example .env` and populate mnemonics there
- `mv scrt_lottery_react_app/.env.example scrt_lottery_react_app/.env` and populate mnemonics there
- `npm install`
- `cd scrt_lottery_react_app/`
- `npm install`

if by any chance you're trying to run everything on localnet don't forget to have instance of localsecret running with:

```bash
docker run -it -p 9091:9091 -p 26657:26657 -p 1317:1317 -p 5000:5000 \
      --name localsecret -v ~/.secretd:/root/.secretd ghcr.io/scrtlabs/localsecret:v1.15.0-beta.7
```

## Build, Store, Instantiate the contract
- `make clean` <sub>cleans cargo and .wasm files</sub>
- `make build` <sub>builds with cargo, runs dockerised wasm optimizer and compiles `scripts/` (may take some time, if fails due to network problems - simply clean build)</sub>
- `make network-local` or `make network-testnet` <sub>sets on which network to proceed to `.env`'s</sub>
- `make store` <sub>calls script from `scripts/` storing the contract</sub>
- `make instantiate` <sub>calls script from `scripts/` instantiating the contract</sub>


## Run frontend
- `cd scrt_lottery_react_app`
- `npm start`

## secretcli
### if you want to use secretcli dont forget to setup its configurations:
```bash
# secretcli v1.15.0-beta7
# localnet
secretcli config set client chain-id secretdev-1
secretcli config set client keyring-backend test
secretcli config set client output json
secretcli config set client node http://localhost:26657
# testnet
secretcli config set client chain-id pulsar-3
secretcli config set client keyring-backend test
secretcli config set client output json
secretcli config set client node https://rpc.pulsar.scrttestnet.con
secretcli keys add <your-wallet> --recover
```
### setup the contract
```bash
# build
make build
# store
secretcli tx compute store contract.wasm.gz --gas-prices 0.1uscrt --gas 5000000 --from a --chain-id secretdev-1 -y
# check
secretcli query compute list-code
# instantiate
secretcli tx compute instantiate 1 '{"participation_fee_uscrt": "500000"}' --from a --gas-prices 0.1uscrt  --label CTR1 -y
# check
secretcli query compute list-contract-by-code 1
```

### interact with the contract
```bash
# queries
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"get_num_of_participants": {}}'
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"get_last_winner": {}}'
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"get_all_participants": {}}'
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"get_participation_fee": {}}'
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"did_i_participate": {"address": "secret1ap26qrlp8mcq2pg6r47w43l0y8zkqm8a450s03"}}'
secretcli query compute query secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"get_owner": {}}'

# executing messages
secretcli tx compute execute secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"participate": {}}' --from a  --gas-prices 0.1uscrt --amount 500000uscrt -y
secretcli tx compute execute secret15ueye5z9eua72wvdpkspca7x3c8ehx4vz2km4t '{"end_lottery": {}}' --from a  --gas-prices 0.1uscrt -y
```

## Demo
Successfully deployed secret lottery smart contract on the testnet and built user-friendly frontend (it is hosted on ipfs, so you can try it out at [https://bafybeiejwlx5fpyww7zk4stmwi5wetim2jyidtpkpyltdaxhzxn36fxcfe.ipfs.flk-ipfs.xyz/](https://bafybeiejwlx5fpyww7zk4stmwi5wetim2jyidtpkpyltdaxhzxn36fxcfe.ipfs.flk-ipfs.xyz/))

![gif](https://github.com/Andriy-Bilenko/secret_lottery/raw/main/res/working.gif)





If you ran into some issues by any chance or need to contact the developer, it would be great to recieve your valuable feedback on email: *bilenko.a.uni@gmail.com*.

<div align="right">
<table><td>
<a href="#start-of-content">↥ Scroll to top</a>
</td></table>
</div>

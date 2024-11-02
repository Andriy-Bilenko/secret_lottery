.PHONY: check
check:
	cargo check

PHONY: test
test: unit-test

.PHONY: unit-test
unit-test:
	cargo unit-test

.PHONY: schema
schema:
	cargo run --example schema

.PHONY: build
build:
	@echo "Building contract with cargo..."
	RUSTFLAGS='-C link-arg=-s' cargo build --release --target wasm32-unknown-unknown
	@echo "done. now optimizing wasm..."
	docker run --rm -v "$$(pwd)":/contract \
	--mount type=volume,source="$$(basename "$$(pwd)")_cache",target=/contract/target \
	--mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
	enigmampc/secret-contract-optimizer:1.0.10
	@echo "building deploy scripts..."
	npm run build
	@echo "build done."

.PHONY: network-localnet network-testnet
network-localnet:
	@echo "Setting network to local in .env's..."
	@sed -i '/^NETWORK=/d' .env; echo "NETWORK=0" >> .env
	@sed -i '/^REACT_APP_NETWORK=/d' ./scrt_lottery_react_app/.env; echo "REACT_APP_NETWORK=0" >> ./scrt_lottery_react_app/.env
	@sed -i '/^NETWORK=/d' ./tests/.env; echo "NETWORK=0" >> ./tests/.env
	@echo "setting done."

network-testnet:
	@echo "Setting network to testnet in .env's..."
	@sed -i '/^NETWORK=/d' .env; echo "NETWORK=1" >> .env
	@sed -i '/^REACT_APP_NETWORK=/d' ./scrt_lottery_react_app/.env; echo "REACT_APP_NETWORK=1" >> ./scrt_lottery_react_app/.env
	@sed -i '/^NETWORK=/d' ./tests/.env; echo "NETWORK=1" >> ./tests/.env
	@echo "setting done."

.PHONY: store instantiate
store:
	@echo "Storing contract with secretjs..."
	node ./dist/store.js
	@echo "storing done."

instantiate:
	@echo "Instantiating contract with secretjs..."
	node ./dist/instantiate.js
	@echo "instantiating done."

.PHONY: clean
clean:
	@echo "cleaning cargo and wasm files..."
	cargo clean
	-rm -rf ./contract.wasm ./contract.wasm.gz dist/
	@echo "cleaning done."

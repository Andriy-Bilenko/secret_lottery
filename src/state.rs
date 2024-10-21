use cosmwasm_std::{Addr, DepsMut, StdResult, Storage};
use cosmwasm_storage::{singleton, singleton_read, ReadonlySingleton, Singleton};
// use cw_storage_plus::Map;
use schemars::JsonSchema;
// use secret_storage_plus::Map;
use secret_toolkit::storage::{Keymap, KeymapBuilder, WithoutIter};
use secret_toolkit::{serialization::Bincode2, storage::Item};
use serde::{Deserialize, Serialize};

pub static CONFIG: Item<State> = Item::new(b"config");

// pub static CONFIG_KEY: &[u8] = b"config"; // identifier for State, for simpler namespace management and to organise state data to be in a predictable place

// moved out of state because not serializable and to use more complex data strucutures
// pub const PARTICIPANTS: Map<String, bool> = Map::new("participants");
pub const PARTICIPANTS: Keymap<String, bool, Bincode2, WithoutIter> =
    KeymapBuilder::new(b"secrets").without_iter().build();

#[derive(Serialize, Deserialize, Clone, Debug, Eq, PartialEq, JsonSchema)]
pub struct State {
    pub participation_fee_uscrt: u128,
    pub last_winner: String,
    pub participants_count: i32,
    pub owner: String,
}

// pub fn config(storage: &mut dyn Storage) -> Singleton<State> {
//     singleton(storage, CONFIG_KEY)
// }

// pub fn config_read(storage: &dyn Storage) -> ReadonlySingleton<State> {
//     singleton_read(storage, CONFIG_KEY)
// }

// to get a winner address
pub fn get_addr_at_index(index: u32) {}
// to add address to participants
pub fn add_participant(participant: String) {}
// check if a participant
pub fn is_participant(deps: DepsMut, addr: String) -> StdResult<bool> {
    // SECRETS
    //     .insert(
    //         deps.storage,
    //         &"virefbvueyr".to_string(),
    //         &"vouifrbief".to_string(),
    //     )
    //     .unwrap();
    // let rez = SECRETS.contains(deps.storage, &Addr::unchecked("0000"));
    // let participant_exists = PARTICIPANTS.may_load(storage, addr.to_string()).unwrap();
    // Ok(rez)
    Ok(false)
    // Ok(PARTICIPANTS.may_load(storage, &addr)?.is_some())
}

// cleaning up after ending the lottery
pub fn clear_participants() {}
// return a Vec<Addr>
pub fn get_all_participants_vector() {}

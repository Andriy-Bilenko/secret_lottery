use cosmwasm_std::Addr;
use cosmwasm_std::BalanceResponse;
use cosmwasm_std::BankMsg;
use cosmwasm_std::BankQuery;
use cosmwasm_std::Coin;
use cosmwasm_std::QueryRequest;
use cosmwasm_std::Uint128;
use cosmwasm_std::{
    entry_point, to_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError, StdResult,
};

// TODONE: use Addr for addresses instead of String
// TODO: use State.participants_count instead of PARTICIPANTS.get_len(deps.storage).unwrap()
// TODO: use errors defined in error.rs
// TODONE: test it REALLY works
// TODO: unit and integration tests
// TODONE: update the last winner
// TODONE: clean map after end of lottery

use crate::msg::{
    AllParticipantsRespose, DidIParticipateResponse, OwnerResponse, ExecuteMsg, InstantiateMsg,
    LastWinnerResponse, NumOfParticipantsResponse, ParticipationFeeRespose, QueryMsg,
};
use crate::state::{
    add_participant, clear_participants, get_addr_at_index, get_all_participants_vector,
    is_participant, State, CONFIG, PARTICIPANTS,
};
// use cosmwasm_std::{
//     entry_point, to_binary, Addr, BalanceResponse, BankMsg, BankQuery, Binary, Coin, Deps, DepsMut,
//     Env, MessageInfo, QueryRequest, Response, StdError, StdResult, Uint128,
// };

// // TODO: use State.participants_count instead of PARTICIPANTS.get_len(deps.storage).unwrap()
// // TODO: use errors defined in error.rs
// // TODO: unit and integration tests




#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let state = State {
        last_winner: Addr::unchecked("0000"),
        participants_count: 0,
        participation_fee_uscrt: msg.participation_fee_uscrt,
        owner: info.sender.clone(),
    };
    deps.api.debug(
        format!(
            "=================================================Received msg: {:?}==================================================",
            msg
        )
        .as_str(),
    );

    CONFIG.save(deps.storage, &state)?;

    deps.api.debug(
        format!(
            "Fuck, Contract was initialized by {}, takes {} uscrt to participate",
            info.sender, msg.participation_fee_uscrt
        )
        .as_str(),
    );

    Ok(Response::default())
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> StdResult<Response> {
    match msg {
        ExecuteMsg::Participate {} => try_participate(deps, info),
        ExecuteMsg::EndLottery {} => try_end_lottery(deps, env, info),
    }
}

pub fn try_participate(deps: DepsMut, info: MessageInfo) -> StdResult<Response> {
    // let required_fee: u128 = CONFIG.load(deps.storage)?.participation_fee_uscrt;
    // Define the required fee in u128
    // let required_fee: u128 = 1_000_000; // Example: 1 SCRT (in smallest unit)
    let required_fee: u128 = CONFIG.load(deps.storage)?.participation_fee_uscrt;

    // Get the amount of SCRT sent with the message
    let sent_amount: Uint128 = info.funds.iter().fold(Uint128::zero(), |acc, coin| {
        if coin.denom == "uscrt" {
            // Check the denomination
            acc + coin.amount
        } else {
            acc
        }
    });

    // Check if the sent amount is equal to the required fee
    if sent_amount.u128() != required_fee {
        return Err(cosmwasm_std::StdError::generic_err(format!(
            "Incorrect fee amount. Expected {}, but got {}",
            required_fee,
            sent_amount.u128()
        )));
    }

    // Continue with the execution logic if the fee matches
    deps.api.debug(
        format!(
            "Received correct fee of {} SCRT, adding to the PARTICIPANTS",
            sent_amount,
        )
        .as_str(),
    );
    add_participant(deps, info.sender);
    Ok(Response::default())
}

pub fn try_end_lottery(deps: DepsMut, env: Env, info: MessageInfo) -> StdResult<Response> {
    // check if owner to end the lottery
    if info.sender != CONFIG.load(deps.storage)?.owner {
        return Err(cosmwasm_std::StdError::generic_err(format!(
            "Cannot end lottery, you're not the owner"
        )));
    }
    // 0. check if at all can end the lottery
    let participants_count = PARTICIPANTS.get_len(deps.storage).unwrap();
    if participants_count == 0 {
        return Err(cosmwasm_std::StdError::generic_err(format!(
            "Cannot end lottery, zero participants"
        )));
    }
    // 1. get the random number in [0..PARTICIPANTS.len-1]
    // Unwrap the randomness from the block
    let randomness = env
        .block
        .random
        .ok_or_else(|| StdError::generic_err("No randomness available"))?;
    // Take the first 4 bytes from the random vector
    let random_bytes: [u8; 4] = randomness.0[0..4]
        .try_into()
        .map_err(|_| StdError::generic_err("Failed to get u32 from random bytes"))?;

    // Convert the bytes into a u32
    let random_u32 = u32::from_le_bytes(random_bytes); // Little-endian conversion

    let random_index = random_u32 % participants_count;
    // 2. get addr on the specified index
    let random_addr = get_addr_at_index(deps.as_ref(), random_index).unwrap();
    // 3. get how much money to send
    let balance: BalanceResponse = deps.querier.query(&QueryRequest::Bank(BankQuery::Balance {
        address: env.contract.address.to_string(),
        denom: "uscrt".to_string(),
    }))?;
    let amount: u128 = balance.amount.amount.into();

    deps.api.debug(
        format!(
            "=================================================Sending {:?} uscrt to winner {:?}==================================================",
            amount, random_addr
        )
        .as_str(),
    );

    let coins = vec![Coin {
        denom: "uscrt".to_string(),
        amount: amount.into(), // Convert u128 to Uint128
    }];

    // 4. update the last winner
    CONFIG.update(deps.storage, |mut state| -> Result<_, StdError> {
        state.last_winner = random_addr.clone();
        Ok(state)
    })?;

    // 5. clean PARTICIPANTS map after end of lottery
    clear_participants(deps);

    // 6. send scrt to the winner
    let send_msg = BankMsg::Send {
        to_address: random_addr.to_string().clone(),
        amount: coins,
    };
    Ok(Response::new()
        .add_message(send_msg)
        .add_attribute("action", "send_scrt")
        .add_attribute("recipient", random_addr)
        .add_attribute("amount", amount.to_string()))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetNumOfParticipants {} => to_binary(&query_num_of_participants(deps)?),
        QueryMsg::DidIParticipate { address } => to_binary(&query_participation(deps, address)?),
        QueryMsg::GetLastWinner {} => to_binary(&query_last_winner(deps)?),
        QueryMsg::GetAllParticipants {} => to_binary(&query_all_participants(deps)?),
        QueryMsg::GetParticipationFee {} => to_binary(&query_participation_fee(deps)?),
        QueryMsg::GetOwner {} => to_binary(&query_owner(deps)?),
    }
}

fn query_num_of_participants(deps: Deps) -> StdResult<NumOfParticipantsResponse> {
    Ok(NumOfParticipantsResponse {
        num: PARTICIPANTS.get_len(deps.storage).unwrap(),
    })
}

fn query_owner(deps: Deps) -> StdResult<OwnerResponse> {
    Ok(OwnerResponse {
        owner: CONFIG.load(deps.storage)?.owner,
    })
}

fn query_participation_fee(deps: Deps) -> StdResult<ParticipationFeeRespose> {
    Ok(ParticipationFeeRespose {
        participation_fee_uscrt: CONFIG.load(deps.storage)?.participation_fee_uscrt,
    })
}

fn query_participation(deps: Deps, address: Addr) -> StdResult<DidIParticipateResponse> {
    Ok(DidIParticipateResponse {
        participated: is_participant(deps, address)?,
    })
}

fn query_last_winner(deps: Deps) -> StdResult<LastWinnerResponse> {
    Ok(LastWinnerResponse {
        last_winner: CONFIG.load(deps.storage)?.last_winner,
    })
}

// unsure
fn query_all_participants(deps: Deps) -> StdResult<AllParticipantsRespose> {
    Ok(AllParticipantsRespose {
        all_participants: get_all_participants_vector(deps).unwrap(),
    })
}

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use cosmwasm_std::testing::*;
//     use cosmwasm_std::{from_binary, Coin, StdError, Uint128};

//     #[test]
//     fn proper_initialization() {
//         let mut deps = mock_dependencies();
//         let info = mock_info(
//             "creator",
//             &[Coin {
//                 denom: "earth".to_string(),
//                 amount: Uint128::new(1000),
//             }],
//         );
//         let init_msg = InstantiateMsg { count: 17 };

//         // we can just call .unwrap() to assert this was a success
//         let res = instantiate(deps.as_mut(), mock_env(), info, init_msg).unwrap();

//         assert_eq!(0, res.messages.len());

//         // it worked, let's query the state
//         let res = query(deps.as_ref(), mock_env(), QueryMsg::GetCount {}).unwrap();
//         let value: CountResponse = from_binary(&res).unwrap();
//         assert_eq!(17, value.count);
//     }

//     #[test]
//     fn increment() {
//         let mut deps = mock_dependencies_with_balance(&[Coin {
//             denom: "token".to_string(),
//             amount: Uint128::new(2),
//         }]);
//         let info = mock_info(
//             "creator",
//             &[Coin {
//                 denom: "token".to_string(),
//                 amount: Uint128::new(2),
//             }],
//         );
//         let init_msg = InstantiateMsg { count: 17 };

//         let _res = instantiate(deps.as_mut(), mock_env(), info, init_msg).unwrap();

//         // anyone can increment
//         let info = mock_info(
//             "anyone",
//             &[Coin {
//                 denom: "token".to_string(),
//                 amount: Uint128::new(2),
//             }],
//         );

//         let exec_msg = ExecuteMsg::Increment {};
//         let _res = execute(deps.as_mut(), mock_env(), info, exec_msg).unwrap();

//         // should increase counter by 1
//         let res = query(deps.as_ref(), mock_env(), QueryMsg::GetCount {}).unwrap();
//         let value: CountResponse = from_binary(&res).unwrap();
//         assert_eq!(18, value.count);
//     }

//     #[test]
//     fn reset() {
//         let mut deps = mock_dependencies_with_balance(&[Coin {
//             denom: "token".to_string(),
//             amount: Uint128::new(2),
//         }]);
//         let info = mock_info(
//             "creator",
//             &[Coin {
//                 denom: "token".to_string(),
//                 amount: Uint128::new(2),
//             }],
//         );
//         let init_msg = InstantiateMsg { count: 17 };

//         let _res = instantiate(deps.as_mut(), mock_env(), info, init_msg).unwrap();

//         // not anyone can reset
//         let info = mock_info(
//             "anyone",
//             &[Coin {
//                 denom: "token".to_string(),
//                 amount: Uint128::new(2),
//             }],
//         );
//         let exec_msg = ExecuteMsg::Reset { count: 5 };

//         let res = execute(deps.as_mut(), mock_env(), info, exec_msg);

//         match res {
//             Err(StdError::GenericErr { .. }) => {}
//             _ => panic!("Must return unauthorized error"),
//         }

//         // only the original creator can reset the counter
//         let info = mock_info(
//             "creator",
//             &[Coin {
//                 denom: "token".to_string(),
//                 amount: Uint128::new(2),
//             }],
//         );
//         let exec_msg = ExecuteMsg::Reset { count: 5 };

//         let _res = execute(deps.as_mut(), mock_env(), info, exec_msg).unwrap();

//         // should now be 5
//         let res = query(deps.as_ref(), mock_env(), QueryMsg::GetCount {}).unwrap();
//         let value: CountResponse = from_binary(&res).unwrap();
//         assert_eq!(5, value.count);
//     }
// }

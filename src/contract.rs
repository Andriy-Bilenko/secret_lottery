use cosmwasm_std::{
    entry_point, to_binary, Addr, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdError,
    StdResult,
};

use crate::msg::{
    AllParticipantsRespose, DidIParticipateResponse, ExecuteMsg, InstantiateMsg,
    LastWinnerResponse, NumOfParticipantsResponse, ParticipationFeeRespose, QueryMsg,
};
// use crate::state::{config, config_read, State};
use crate::state::{State, CONFIG, PARTICIPANTS};

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> StdResult<Response> {
    let state = State {
        last_winner: "0000".to_string(),
        participants_count: 0,
        participation_fee_uscrt: msg.participation_fee_uscrt,
        owner: info.sender.clone().to_string(),
    };

    // config(deps.storage).save(&state)?;

    deps.api.debug(
        format!(
            "Fuck Contract was initialized by {}, takes {} uscrt to participate",
            info.sender, msg.participation_fee_uscrt
        )
        .as_str(),
    );

    // Ok(Response::default())

    // let state = State {
    //     gateway_address: msg.gateway_address,
    //     gateway_hash: msg.gateway_hash,
    //     gateway_key: msg.gateway_key,
    // };

    CONFIG.save(deps.storage, &state)?;

    Ok(Response::default())
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> StdResult<Response> {
    match msg {
        ExecuteMsg::Participate {} => try_participate(deps, info),
        ExecuteMsg::EndLottery {} => try_end_lottery(deps, info),
    }
}

pub fn try_participate(deps: DepsMut, info: MessageInfo) -> StdResult<Response> {
    Ok(Response::default())
}

pub fn try_end_lottery(deps: DepsMut, info: MessageInfo) -> StdResult<Response> {
    Ok(Response::default())
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetNumOfParticipants {} => to_binary(&query_num_of_participants(deps)?),
        QueryMsg::DidIParticipate { address } => to_binary(&query_participation(deps, address)?),
        QueryMsg::GetLastWinner {} => to_binary(&query_last_winner(deps)?),
        QueryMsg::GetAllParticipants {} => to_binary(&query_all_participants(deps)?),
        QueryMsg::GetParticipationFee {} => to_binary(&query_participation_fee(deps)?),
    }
}

// fn query_count(deps: Deps) -> StdResult<CountResponse> {
//     let state = config_read(deps.storage).load()?;
//     Ok(CountResponse { count: state.count })
// }

fn query_num_of_participants(deps: Deps) -> StdResult<NumOfParticipantsResponse> {
    Ok(NumOfParticipantsResponse { num: 0 })
}

fn query_participation_fee(deps: Deps) -> StdResult<ParticipationFeeRespose> {
    Ok(ParticipationFeeRespose {
        participation_fee_uscrt: 1,
    })
}

fn query_participation(deps: Deps, address: String) -> StdResult<DidIParticipateResponse> {
    // 1. Load state
    // let state: State = config_read(deps.storage).load()?;

    // // 2. Check if the address exists in the participants map
    // let participated = state
    //     .participants
    //     .may_load(deps.storage, &address)?
    //     .is_some();

    // 3. Return the response indicating if the address participated
    Ok(DidIParticipateResponse {
        participated: false,
    })
}

fn query_last_winner(deps: Deps) -> StdResult<LastWinnerResponse> {
    // // 1. load state
    // let state = config_read(deps.storage).load()?;

    // deps.api.debug("last_winner queried successfully");

    // // 2. return count response
    // Ok(LastWinnerResponse {
    //     last_winner: state.last_winner,
    // })
    Ok(LastWinnerResponse {
        last_winner: "0000".to_string(),
    })
}

// unsure
fn query_all_participants(deps: Deps) -> StdResult<AllParticipantsRespose> {
    // 1. Load state
    // let state: State = config_read(deps.storage).load()?;

    // // Create a vector to store the addresses of the participants
    // let mut participants: Vec<Addr> = Vec::new();

    // // 2. Iterate over the `Map<Addr, bool>` stored in `state.participants`
    // let all_participants =
    //     state
    //         .participants
    //         .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)?;

    // for participant in all_participants {
    //     let (addr, _) = participant?; // Ignore the boolean value
    //     participants.push(addr);
    // }

    // // 3. Return the vector of addresses in the response struct
    // Ok(AllParticipantsResponse { participants })
    Ok(AllParticipantsRespose {
        all_participants: Vec::new(),
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

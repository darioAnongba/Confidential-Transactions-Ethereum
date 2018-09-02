import * as types from "../actions/types";
import { REHYDRATE } from "redux-persist";
import Wallet from "../model/Wallet";

export const wallet = (state = null, action) => {
  switch (action.type) {
    case REHYDRATE:
      if (action.payload && action.payload.wallet) {
        return new Wallet(action.payload.wallet);
      }
      return state;
    case types.WALLET_UPDATE:
      return Object.assign({}, state, action.wallet);
    default:
      return state;
  }
};

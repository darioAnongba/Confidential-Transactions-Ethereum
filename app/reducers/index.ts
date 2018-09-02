import { combineReducers } from "redux";
import * as session from "./session";
import * as wallet from "./wallet";
import * as parameters from "./parameters";

// Combine all reducer
export default combineReducers(Object.assign({}, session, wallet, parameters));

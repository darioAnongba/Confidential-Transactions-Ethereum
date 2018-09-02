import * as types from "../actions/types";

export const session = (state = null, action) => {
  switch (action.type) {
    case types.SESSION_INIT:
      return Object.assign({}, state, action.session);
    default:
      return state;
  }
};

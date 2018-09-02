import * as types from "../actions/types";

export const parameters = (state = null, action) => {
  switch (action.type) {
    case types.PARAMETERS_SAVE:
      return Object.assign({}, state, action.parameters);
    default:
      return state;
  }
};

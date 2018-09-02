import { createStore, applyMiddleware } from "redux";
import reducer from "../reducers";
import thunk from "redux-thunk";
import { persistStore, persistReducer } from "redux-persist";
import createSensitiveStorage from "redux-persist-sensitive-storage";

const persistConfig = {
  key: "root",
  storage: createSensitiveStorage(),
  whitelist: ["wallet", "parameters"]
};

const persistedReducer = persistReducer(persistConfig, reducer);

export const store = createStore(persistedReducer, applyMiddleware(thunk));
export const persistor = persistStore(store);

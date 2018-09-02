import * as SessionActions from "./session";
import * as TokenActions from "./token";
import * as WalletActions from "./wallet";

export default Object.assign({}, SessionActions, WalletActions, TokenActions);

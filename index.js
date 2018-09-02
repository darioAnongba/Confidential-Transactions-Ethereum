/** @format */

import { AppRegistry } from "react-native";
import "node-libs-react-native/globals";
import "./global";
import App from "./app/containers/App";
import { name as appName } from "./app.json";

import { YellowBox } from 'react-native'
YellowBox.ignoreWarnings(['Warning: isMounted(...) is deprecated'])

global.__old_console_warn = global.__old_console_warn || console.warn;
global.console.warn = str => {
  let tst = (str || '') + '';
  if (tst.startsWith('Warning: isMounted(...) is deprecated')) {
    return;
  }
  return global.__old_console_warn.apply(console, [str]);
};

AppRegistry.registerComponent(appName, () => App);

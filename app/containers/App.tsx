import React, { Component } from "react";
import { StyleSheet, View, StatusBar } from "react-native";
import { Provider } from "react-redux";
import { createStackNavigator } from "react-navigation";
import { PersistGate } from "redux-persist/integration/react";
import { Root } from "native-base";
import { colors } from "../styles/App.style";
import { store, persistor } from "../store";
import Introduction from "./Introduction";
import TabsMenu from "../components/TabsMenu";
import ImportWallet from "./ImportWallet";

export const AppNavigator = createStackNavigator(
  {
    Introduction: {
      screen: Introduction,
      navigationOptions: {
        gestureEnabled: false
      }
    },
    Tabs: {
      screen: TabsMenu,
      navigationOptions: {
        gestureEnabled: false
      }
    },
    ImportWallet: {
      screen: ImportWallet,
      navigationOptions: {
        gestureEnabled: false
      }
    }
  },
  {
    headerMode: "none",
    initialRouteName: "Introduction"
  }
);

export default class App extends Component<{}, {}> {
  render() {
    return (
      <Root>
        <View style={styles.statusBar}>
          <StatusBar backgroundColor={"transparent"} translucent />
          <Provider store={store}>
            <PersistGate persistor={persistor}>
              <AppNavigator />
            </PersistGate>
          </Provider>
        </View>
      </Root>
    );
  }
}

const styles = StyleSheet.create({
  statusBar: {
    flex: 1,
    backgroundColor: colors.primaryNormal
  }
});

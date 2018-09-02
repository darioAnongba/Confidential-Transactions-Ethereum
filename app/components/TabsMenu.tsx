import React from "react";
import { createBottomTabNavigator } from "react-navigation";
import Icon from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { localeString } from "../locales";
import { Dimensions } from "react-native";
import { colors } from "../styles/App.style";
import Dashboard from "../containers/Dashboard";
import Send from "../containers/Send";
import Settings from "../containers/Settings";
import Receive from "../containers/Receive";
import Withdraw from "../containers/Withdraw";

const Tabs = createBottomTabNavigator(
  {
    Dashboard: {
      screen: Dashboard,
      navigationOptions: {
        tabBarLabel: localeString("commons.tab_dashboard"),
        tabBarIcon: ({ tintColor }) => {
          return (
            <Icon name="account-balance-wallet" size={35} color={tintColor} />
          );
        }
      }
    },
    Receive: {
      screen: Receive,
      navigationOptions: {
        tabBarLabel: localeString("commons.tab_receive"),
        tabBarIcon: ({ tintColor }) => {
          return <Icon name="call-received" size={35} color={tintColor} />;
        }
      }
    },
    Send: {
      screen: Send,
      navigationOptions: {
        tabBarLabel: localeString("commons.tab_send"),
        tabBarIcon: ({ tintColor }) => {
          return <Icon name="send" size={35} color={tintColor} />;
        }
      }
    },
    Withdraw: {
      screen: Withdraw,
      navigationOptions: {
        tabBarLabel: localeString("commons.tab_withdraw"),
        tabBarIcon: ({ tintColor }) => {
          return (
            <MaterialCommunityIcons
              name="cash-multiple"
              size={35}
              color={tintColor}
            />
          );
        }
      }
    },
    Settings: {
      screen: Settings,
      navigationOptions: {
        tabBarLabel: localeString("commons.tab_settings"),
        tabBarIcon: ({ tintColor }) => {
          return <Icon name="more-horiz" size={35} color={tintColor} />;
        }
      }
    }
  },
  {
    swipeEnabled: false,
    animationEnabled: false,
    lazy: false,
    initialLayout: Dimensions.get("window"),
    tabBarOptions: {
      activeTintColor: colors.primaryNormal,
      inactiveTintColor: "gray",
      tabStyle: {
        padding: 0,
        justifyContent: "space-between"
      },
      labelStyle: {
        height: 15,
        paddingTop: 1,
        backgroundColor: "transparent"
      },
      style: {
        paddingTop: 5,
        marginBottom: 5,
        overflow: "visible"
      }
    }
  }
);

export default Tabs;

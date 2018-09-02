import React, { Component } from "react";
import { connect } from "react-redux";
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  AsyncStorage,
  Dimensions,
  Clipboard
} from "react-native";
import { Spinner, H1 } from "native-base";
import { colors, AppFonts, TextSize } from "../styles/App.style";
import { localeString } from "../locales";
import Session from "../model/Session";
import Wallet from "../model/Wallet";
import actions from "../actions";
import { keys } from "../store/api/config";
import { Card, List, ListItem } from "react-native-elements";
import { showShortToastAndroid } from "../utils/errorHandler";
import Icon from "react-native-vector-icons/MaterialIcons";

interface Props {
  navigation: any;
  session: Session;
  wallet: Wallet;
  createWallet: Function;
  refreshWallet: Function;
}

interface State {
  refreshing: boolean;
  loadingText: string;
}

class Dashboard extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      refreshing: false,
      loadingText: localeString("dashboard.syncing")
    };
  }

  async componentDidMount() {
    this.setState({
      refreshing: true
    });

    try {
      const wallet = await AsyncStorage.getItem(keys.WALLET);
      if (wallet === null) {
        this.setState({
          loadingText: localeString("dashboard.first_time_loading")
        });
        await this.props.createWallet();
      } else {
        await this.props.refreshWallet();
      }
    } catch (error) {
      showShortToastAndroid("Error while fetching wallet");
      console.log(error);
      return;
    }

    showShortToastAndroid("Wallet synced");
    this.setState({
      refreshing: false
    });
  }

  async onPressRefresh() {
    this.setState({
      refreshing: true,
      loadingText: localeString("dashboard.syncing")
    });

    await this.props.refreshWallet();
    showShortToastAndroid("Wallet synced");

    this.setState({
      refreshing: false
    });
  }

  copyToClipboard(address: string) {
    Clipboard.setString(address);
    showShortToastAndroid("Transaction hash copied to clipboard");
  }

  render() {
    return (
      <View
        style={{
          flex: 1
        }}
      >
        <View style={{ flex: 1 }}>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>
              {localeString("commons.tab_dashboard")}
            </Text>
            <Icon
              name="refresh"
              onPress={() => this.onPressRefresh()}
              color={colors.white}
              style={styles.refreshIcon}
              size={24}
            />
          </View>

          {this.props.wallet && !this.state.refreshing ? (
            <ScrollView contentContainerStyle={styles.innerContainer}>
              <H1 style={styles.balance}>{this.props.wallet.balance} CHFT</H1>
              <Card
                title="Incoming transactions"
                containerStyle={styles.transactions}
              >
                {this.props.wallet.incomingTxs.map(tx => (
                  <ListItem
                    key={tx.id}
                    title={`${tx.value} CHFT`}
                    subtitle={tx.from}
                  />
                ))}
              </Card>
              <Card
                title="Outgoing transactions"
                containerStyle={styles.transactions}
              >
                {this.props.wallet.outgoingTxs.map(tx => (
                  <ListItem
                    key={tx.hash}
                    title={`${tx.value} CHFT`}
                    subtitle={tx.to}
                    onLongPress={() => this.copyToClipboard(tx.hash)}
                  />
                ))}
              </Card>
            </ScrollView>
          ) : (
              <View style={styles.innerContainer}>
                <Spinner size="large" color={colors.primaryNormal} />
                <Text>{this.state.loadingText}...</Text>
              </View>
            )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerBar: {
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: colors.primaryNormal,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end"
  },
  headerTitle: {
    flex: 1,
    marginLeft: 10,
    fontFamily: AppFonts.normal,
    fontSize: TextSize.big,
    color: colors.white
  },
  refreshIcon: {
    alignSelf: "flex-end",
    marginRight: 20
  },
  innerContainer: {
    justifyContent: "center",
    alignItems: "center"
  },
  balance: {
    fontFamily: AppFonts.bold,
    fontSize: TextSize.huge,
    marginTop: 30,
    lineHeight: 40
  },
  transactions: {
    width: Dimensions.get("window").width - 20
  }
});

// Link store data to component :
function mapStateToProps(state) {
  return {
    session: state.session,
    wallet: state.wallet
  };
}

// Allow actions function from the props :
function mapDispatchToProps(dispatch) {
  return {
    createWallet: () => actions.createWallet(dispatch),
    refreshWallet: () => actions.refreshWallet(dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Dashboard);

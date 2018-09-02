import React, { Component } from "react";
import { connect } from "react-redux";
import { View, StyleSheet, Dimensions, Clipboard } from "react-native";
import { Text, Spinner, Button } from "native-base";
import { colors, AppFonts, TextSize } from "../styles/App.style";
import { localeString } from "../locales";
import Session from "../model/Session";
import Wallet from "../model/Wallet";
import actions from "../actions";
import { showShortToastAndroid } from "../utils/errorHandler";
import { keys } from "../store/api/config";
import SInfo from "react-native-sensitive-info";

const ELEMENTS_WIDTH = Dimensions.get("window").width - 20;

interface Props {
  navigation: any;
  session: Session;
  wallet: Wallet;
  register: Function;
}

interface State {
  isLoading: boolean;
}

class Settings extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isLoading: false
    };

    this.onPressRegister = this.onPressRegister.bind(this);
    this.getEtherBalance = this.getEtherBalance.bind(this);
    this.copyToClipboard = this.copyToClipboard.bind(this);
  }

  async onPressRegister() {
    this.setState({
      isLoading: true
    });

    await this.props.register().catch(err => {
      showShortToastAndroid("Error while registering");
    });

    this.setState({
      isLoading: false
    });
  }

  async copyToClipboard() {
    const mnemonic = await SInfo.getItem(keys.MNEMONIC, {});
    Clipboard.setString(mnemonic);
    showShortToastAndroid("Seed copied to clipboard");
  }

  async getEtherBalance() {
    const { account, web3 } = this.props.session;
    const balance = await web3.eth.getBalance(account);
    showShortToastAndroid(web3.utils.fromWei(balance, "ether") + " ETH");
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
              {localeString("commons.tab_settings")}
            </Text>
          </View>

          <View style={styles.innerContainer}>
            {!this.props.session.isRegistered && !this.state.isLoading ? (
              <Button
                style={styles.button}
                onPress={() => this.onPressRegister()}
              >
                <Text style={styles.buttonText}>
                  {localeString("settings.register")}
                </Text>
              </Button>
            ) : (
              undefined
            )}

            {this.state.isLoading ? (
              <Spinner size="large" color={colors.primaryNormal} />
            ) : (
              undefined
            )}

            {this.props.session.isRegistered && !this.state.isLoading ? (
              <Text style={{ marginBottom: 30 }}>
                Great, you are registered!
              </Text>
            ) : (
              undefined
            )}
            <Button style={styles.button} onPress={this.copyToClipboard}>
              <Text style={styles.buttonText}>
                {localeString("settings.copy_seed")}
              </Text>
            </Button>
            <Button style={styles.button} onPress={this.getEtherBalance}>
              <Text style={styles.buttonText}>
                {localeString("settings.get_eth_balance")}
              </Text>
            </Button>
          </View>
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
  innerContainer: {
    flex: 1,
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
    width: ELEMENTS_WIDTH,
    alignSelf: "center"
  },
  item: {
    marginBottom: 30
  },
  button: {
    width: ELEMENTS_WIDTH,
    height: 60,
    alignSelf: "center",
    backgroundColor: colors.primaryNormal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30
  },
  buttonText: {
    fontFamily: AppFonts.normal,
    fontSize: 16
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
    register: () => actions.register(dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Settings);

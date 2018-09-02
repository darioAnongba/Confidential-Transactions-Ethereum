import React, { Component } from "react";
import { connect } from "react-redux";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, Spinner, Button } from "native-base";
import { FormLabel, FormInput } from "react-native-elements";
import { colors, AppFonts, TextSize } from "../styles/App.style";
import { localeString } from "../locales";
import Session from "../model/Session";
import Wallet from "../model/Wallet";
import {
  showLongToastAndroid,
  showShortToastAndroid
} from "../utils/errorHandler";
import actions from "../actions";
import { maxTransferValue } from "../utils";

const ELEMENTS_WIDTH = Dimensions.get("window").width - 20;

interface Props {
  navigation: any;
  session: Session;
  wallet: Wallet;
  withdraw: Function;
  burn: Function;
}

interface State {
  isProcessing: boolean;
  amount: string;
}

class Withdraw extends Component<Props, State> {
  private form: any;

  constructor(props: Props) {
    super(props);

    this.state = {
      isProcessing: false,
      amount: null
    };

    this.onPressWithdraw = this.onPressWithdraw.bind(this);
    this.onPressBurn = this.onPressBurn.bind(this);
  }

  componentDidMount() {
    const { centralBankAddress, account } = this.props.session;
    if (centralBankAddress !== account) {
      this.form = (
        <View>
          <FormLabel labelStyle={styles.label}>
            {localeString("send.amount")}
          </FormLabel>
          <FormInput
            onChangeText={amount => this.setState({ amount })}
            value={this.state.amount}
            keyboardType={"numeric"}
            inputStyle={styles.input}
          />
          <Button style={styles.button} onPress={this.onPressWithdraw}>
            <Text style={styles.buttonText}>
              {localeString("withdraw.withdraw_button")}
            </Text>
          </Button>
        </View>
      );
    } else {
      this.form = (
        <View style={styles.innerContainer}>
          <Button style={styles.button} onPress={this.onPressBurn}>
            <Text style={styles.buttonText}>
              {localeString("withdraw.burn_button")}
            </Text>
          </Button>
        </View>
      );
    }
  }

  async onPressBurn() {
    if (this.props.wallet.utxos.length === 0) {
      this.handleError("Nothing to burn");
      return;
    }

    this.setState({
      isProcessing: true
    });

    try {
      await this.props.burn();
      showLongToastAndroid("Burning of tokens successful");
    } catch (err) {
      this.handleError(localeString("withdraw.error_burn"));
    }

    this.setState({
      isProcessing: false
    });
  }

  async onPressWithdraw() {
    this.setState({
      isProcessing: true
    });

    const { token, centralBankAddress } = this.props.session;
    const amount = parseInt(this.state.amount, 10);
    const maxAmount = maxTransferValue();

    if (isNaN(amount) || amount <= 0 || amount >= maxAmount) {
      this.handleError(
        "Invalid amount, the max authorized amount is: " + (maxAmount - 1)
      );
      return;
    }

    if (amount > this.props.wallet.balance) {
      this.handleError("insufficient funds");
      return;
    }

    // Check that the central bank address is registered (even if that should be an assertion)
    const isRegistered = await token.methods
      .isRegistered(centralBankAddress)
      .call();
    if (!isRegistered) {
      this.handleError(localeString("withdraw.error_centralbank_registration"));
      return;
    }

    try {
      await this.props.withdraw(amount);
    } catch (error) {
      this.handleError(localeString("withdraw.error_withdraw"));
      return;
    }

    showLongToastAndroid("Withdrawal of " + amount + " CHFT successful");

    this.setState({
      isProcessing: false,
      amount: null
    });
  }

  handleError(message) {
    showShortToastAndroid(message);
    this.setState({
      isProcessing: false
    });
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
              {localeString("commons.tab_withdraw")}
            </Text>
          </View>

          {this.props.wallet && !this.state.isProcessing ? (
            this.form
          ) : (
            <Spinner size="large" color={colors.primaryNormal} />
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
  innerContainer: {
    flex: 1,
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
    width: ELEMENTS_WIDTH,
    alignSelf: "center"
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
  },
  input: {
    marginBottom: 20
  },
  label: {
    fontFamily: AppFonts.normal,
    fontSize: 14
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
    withdraw: amount => actions.withdraw(dispatch, amount),
    burn: () => actions.burn(dispatch)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Withdraw);

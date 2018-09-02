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
import Icon from "react-native-vector-icons/FontAwesome";
import QRCodeScanner from "react-native-qrcode-scanner";
import { getAddressFromQRCode, maxTransferValue } from "../utils";

const ELEMENTS_WIDTH = Dimensions.get("window").width - 20;

interface Props {
  navigation: any;
  session: Session;
  wallet: Wallet;
  mint: Function;
  transfer: Function;
}

interface State {
  isProcessing: boolean;
  isCameraOpen: boolean;
  amount: string;
  recipient: string;
}

class Send extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isProcessing: false,
      isCameraOpen: false,
      amount: null,
      recipient: ""
    };
  }

  async onPressSend() {
    this.setState({
      isProcessing: true
    });

    const recipient = this.state.recipient;
    const amount = parseInt(this.state.amount, 10);
    const { web3, token, account, centralBankAddress } = this.props.session;
    const maxAmount = maxTransferValue();

    if (isNaN(amount) || amount <= 0 || amount >= maxAmount) {
      this.handleError(
        "Invalid amount, the max authorized amount is: " + (maxAmount - 1)
      );
      return;
    }
    if (!web3.utils.isAddress(recipient)) {
      this.handleError(localeString("send.invalid_address"));
      return;
    }

    // Check that the recipient is registered
    const isRegistered = await token.methods.isRegistered(recipient).call();
    if (!isRegistered) {
      this.handleError(localeString("send.not_registered"));
      return;
    }

    // Send or Mint depending on account
    try {
      if (account === centralBankAddress) {
        await this.props.mint(recipient, amount);
        showLongToastAndroid(
          "Successfully minted " + amount + " tokens to " + recipient
        );
      } else {
        if (amount > this.props.wallet.balance) {
          this.handleError(localeString("send.insufficient_funds"));
          return;
        }

        await this.props.transfer(recipient, amount);
      }
    } catch (error) {
      this.handleError(localeString("send.error_transfer"));
      return;
    }

    showLongToastAndroid(
      "Successfully transferred " + amount + " tokens to " + recipient
    );

    this.setState({
      isProcessing: false,
      recipient: "",
      amount: null
    });
  }

  handleError(message) {
    showShortToastAndroid(message);
    this.setState({
      isProcessing: false
    });
  }

  onPressCamera() {
    this.setState({
      isCameraOpen: true
    });
  }

  onPressCloseCamera() {
    this.setState({
      isCameraOpen: false
    });
  }

  onQRScanSuccess(e) {
    const address = getAddressFromQRCode(e.data, this.props.session.web3);
    this.setState({
      isCameraOpen: false,
      recipient: address
    });
  }

  render() {
    return (
      <View
        style={{
          flex: 1
        }}
      >
        {this.state.isCameraOpen ? (
          <QRCodeScanner
            containerStyle={styles.qrCodeContainer}
            showMarker={true}
            onRead={e => this.onQRScanSuccess(e)}
            topContent={
              <Text style={styles.centerText}>Scan your QR Code</Text>
            }
            bottomContent={
              <Button
                style={styles.closeButton}
                onPress={() => this.onPressCloseCamera()}
              >
                <Text style={styles.closeButtonText}>
                  {localeString("send.close")}
                </Text>
              </Button>
            }
          />
        ) : (
          <View style={{ flex: 1 }}>
            <View style={styles.headerBar}>
              <Text style={styles.headerTitle}>
                {localeString("commons.tab_send")}
              </Text>
              <Icon
                name="qrcode"
                onPress={() => this.onPressCamera()}
                color={colors.white}
                style={styles.cameraIcon}
                size={24}
              />
            </View>

            {this.props.wallet && !this.state.isProcessing ? (
              <View>
                <FormLabel labelStyle={styles.label}>
                  {localeString("send.recipient")}
                </FormLabel>
                <FormInput
                  placeholder="0x..."
                  onChangeText={recipient => this.setState({ recipient })}
                  value={this.state.recipient}
                  inputStyle={styles.input}
                />

                <FormLabel labelStyle={styles.label}>
                  {localeString("send.amount")}
                </FormLabel>
                <FormInput
                  onChangeText={amount => this.setState({ amount })}
                  value={this.state.amount}
                  keyboardType={"numeric"}
                  inputStyle={styles.input}
                />
                <Button
                  style={styles.button}
                  onPress={() => this.onPressSend()}
                >
                  <Text style={styles.buttonText}>
                    {localeString("commons.tab_send")}
                  </Text>
                </Button>
              </View>
            ) : (
              <Spinner size="large" color={colors.primaryNormal} />
            )}
          </View>
        )}
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
  cameraIcon: {
    alignSelf: "flex-end",
    marginRight: 20
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
  closeButton: {
    width: ELEMENTS_WIDTH - 20,
    height: 60,
    alignSelf: "center",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30
  },
  closeButtonText: {
    fontFamily: AppFonts.normal,
    fontSize: 16,
    color: colors.primaryNormal
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
  },
  qrCodeContainer: {
    backgroundColor: colors.primaryNormal
  },
  centerText: {
    marginTop: 30,
    flex: 1,
    fontSize: 18,
    padding: 24,
    color: colors.white
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
    mint: (recipient, amount) => actions.mint(dispatch, recipient, amount),
    transfer: (recipient, amount) =>
      actions.transfer(dispatch, recipient, amount)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Send);

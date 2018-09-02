import React, { Component } from "react";
import { connect } from "react-redux";
import { View, StyleSheet, Clipboard } from "react-native";
import { Text, Button } from "native-base";
import { colors, AppFonts, TextSize } from "../styles/App.style";
import { localeString } from "../locales";
import Session from "../model/Session";
import Wallet from "../model/Wallet";
import QRCode from "react-native-qrcode";
import { truncateAddress } from "../utils";
import { showShortToastAndroid } from "../utils/errorHandler";

interface Props {
  navigation: any;
  session: Session;
  wallet: Wallet;
}

interface State {}

class Receive extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isLoading: false
    };
  }

  copyToClipboard() {
    Clipboard.setString(this.props.session.account);
    showShortToastAndroid("Address copied to clipboard");
  }

  render() {
    return (
      <View
        style={{
          flex: 1
        }}
      >
        <View style={styles.headerBar}>
          <Text style={styles.headerTitle}>
            {localeString("commons.tab_receive")}
          </Text>
        </View>
        <View style={styles.innerContainer}>
          <Button style={styles.button} onPress={() => this.copyToClipboard()}>
            <Text style={styles.buttonText}>
              {truncateAddress(this.props.session.account)}
            </Text>
          </Button>
          <QRCode value={"ethereum:" + this.props.session.account} size={250} />
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
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center"
  },
  button: {
    width: 300,
    height: 30,
    alignSelf: "center",
    backgroundColor: colors.primaryNormal,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 60
  },
  buttonText: {
    fontFamily: AppFonts.normal,
    fontSize: 12
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
  return {};
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Receive);

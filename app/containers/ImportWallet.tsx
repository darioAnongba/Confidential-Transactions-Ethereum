import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button } from "native-base";
import { colors, AppFonts, TextSize } from "../styles/App.style";
import { Spinner } from "native-base";
import { connect } from "react-redux";
import { FormLabel, FormInput } from "react-native-elements";
import SInfo from "react-native-sensitive-info";
import actions from "../actions";
import { localeString } from "../locales";
import bip39 from "react-native-bip39";
import { keys } from "../store/api/config";
import { showShortToastAndroid } from "../utils/errorHandler";

interface PropsType {
  navigation: any;
  createSession: Function;
}

interface State {
  loading: boolean;
  mnemonic: string;
}

class ImportWallet extends Component<PropsType, State> {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      mnemonic: ""
    };
  }

  handleError(message) {
    showShortToastAndroid(message);
    this.setState({
      loading: false
    });
  }

  async onPressImport() {
    this.setState({
      loading: true
    });

    const mnemonic = this.state.mnemonic.toLocaleLowerCase();
    if (
      mnemonic.trim().split(/\s+/g).length < 12 ||
      !bip39.validateMnemonic(mnemonic)
    ) {
      this.handleError("Invalid mnemonic, please retry");
      return;
    }

    await SInfo.setItem(keys.MNEMONIC, mnemonic, {}).catch(() => {
      showShortToastAndroid("Error while saving the new mnemonic");
      return;
    });

    // Init session and move to dashboard
    await this.props.createSession(mnemonic);

    this.setState({
      loading: false,
      mnemonic: ""
    });
    this.navigateToDashboard();
  }

  navigateToDashboard() {
    this.props.navigation.navigate("Tabs");
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>
              {localeString("intro.import_wallet")}
            </Text>
          </View>
          {this.state.loading ? (
            <View style={styles.innerContainer}>
              <Spinner size="large" color={colors.primaryNormal} />
              <Text>{localeString("intro.init_wallet")}...</Text>
            </View>
          ) : (
            <View>
              <FormLabel labelStyle={styles.label}>Mnemonic words</FormLabel>
              <FormInput
                onChangeText={mnemonic => this.setState({ mnemonic })}
                value={this.state.mnemonic}
                multiline={true}
                inputStyle={styles.input}
              />
              <Button
                style={styles.button}
                onPress={() => this.onPressImport()}
              >
                <Text style={styles.buttonText}>
                  {localeString("intro.import_button")}
                </Text>
              </Button>
            </View>
          )}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
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
  button: {
    width: 300,
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
    fontSize: 16
  }
});

// Link store data to component :
function mapStateToProps(state) {
  return {};
}

// Allow actions function from the props :
function mapDispatchToProps(dispatch) {
  return {
    createSession: mnemonic => actions.createSession(dispatch, mnemonic)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(ImportWallet);

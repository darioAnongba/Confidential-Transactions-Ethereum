import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { connect } from "react-redux";
import { View, Button, Text, Spinner } from "native-base";
import bip39 from "react-native-bip39";
import SplashScreen from "react-native-splash-screen";
import SInfo from "react-native-sensitive-info";
import { colors, AppFonts } from "../styles/App.style";
import { localeString } from "../locales";
import HeaderBar from "./HeaderBar";
import { keys } from "../store/api/config";
import actions from "../actions";
import {
  showShortToastAndroid,
  showLongToastAndroid
} from "../utils/errorHandler";

interface Props {
  navigation: any;
  rehydrated: boolean;
  createSession: Function;
  loadSession: Function;
}

interface State {
  isLoading: boolean;
  loadingText: string;
}

class Introduction extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      isLoading: true,
      loadingText: localeString("intro.loading")
    };
  }

  async componentDidMount() {
    if (this.props.rehydrated) {
      const mnemonic = await SInfo.getItem(keys.MNEMONIC, {}).catch(() =>
        showLongToastAndroid(localeString("intro.error_storage"))
      );

      if (mnemonic !== null) {
        await this.props.loadSession(mnemonic);
        SplashScreen.hide();
        this.navigateToDashboard();
      } else {
        SplashScreen.hide();
        this.setState({
          isLoading: false
        });
      }
    } else {
      // Impossible according to the redux persist doc
      throw Error("persist is not rehydrating correctly");
    }
  }

  navigateToDashboard() {
    this.props.navigation.navigate("Tabs");
  }

  async onPressCreate() {
    try {
      this.setState({
        isLoading: true,
        loadingText: localeString("intro.init_wallet")
      });

      // Store the generated mnemonic in storage
      const mnemonic = await bip39.generateMnemonic();
      await SInfo.setItem(keys.MNEMONIC, mnemonic, {});

      // Init session and move to dashboard
      await this.props.createSession(mnemonic);
      this.navigateToDashboard();
    } catch (err) {
      showShortToastAndroid(localeString("intro.error_mnemonic_generation"));
    }
  }

  onPressImport() {
    this.props.navigation.navigate("ImportWallet");
  }

  render() {
    return (
      <View
        style={{
          flex: 1
        }}
      >
        <HeaderBar
          titleStyle={styles.headerTitle}
          headerTitle={localeString("intro.title")}
        />
        {this.state.isLoading ? (
          <View style={styles.innerContainer}>
            <Spinner size="large" color={colors.primaryNormal} />
            <Text>{this.state.loadingText}...</Text>
          </View>
        ) : (
          <View style={styles.innerContainer}>
            <Button style={styles.button} onPress={() => this.onPressCreate()}>
              <Text style={styles.buttonText}>
                {localeString("intro.create_wallet")}
              </Text>
            </Button>
            <Button style={styles.button} onPress={() => this.onPressImport()}>
              <Text style={styles.buttonText}>
                {localeString("intro.import_wallet")}
              </Text>
            </Button>
          </View>
        )}
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
  headerTitle: {
    textAlign: "center",
    flex: 1
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
  }
});

// Link store data to component :
function mapStateToProps(state) {
  return {
    rehydrated: state._persist.rehydrated
  };
}

// Allow actions function from the props :
function mapDispatchToProps(dispatch) {
  return {
    createSession: mnemonic => actions.createSession(dispatch, mnemonic),
    loadSession: mnemonic => actions.loadSession(dispatch, mnemonic)
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Introduction);

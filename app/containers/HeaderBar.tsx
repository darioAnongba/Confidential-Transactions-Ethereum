import React, { Component } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
  RegisteredStyle,
  TextStyle
} from "react-native";
import Svg, { Rect, RadialGradient, Defs, Stop } from "react-native-svg";
import { connect } from "react-redux";
import { AppFonts } from "../styles/App.style";

const DEFAULT_HEIGHT = Platform.OS === "ios" ? 75 : 65;
const DEFAULT_WIDTH = Dimensions.get("window").width;

interface Props {
  headerTitle: string;
  bigHeader: boolean;
  titleStyle?: RegisteredStyle<TextStyle>;
}

interface State {
  headerWidth: number;
  headerHeight: number;
}

class HeaderBar extends Component<Props, State> {
  constructor(props) {
    super(props);
    this.state = {
      headerWidth: DEFAULT_WIDTH,
      headerHeight: DEFAULT_HEIGHT
    };

    this.onMainViewLayout = this.onMainViewLayout.bind(this);
  }

  onMainViewLayout(event) {
    const { width, height } = event.nativeEvent.layout;
    this.setState({
      headerWidth: width,
      headerHeight: height
    });
  }

  render() {
    return (
      <View style={{ width: "100%" }} onLayout={this.onMainViewLayout}>
        <View style={styles.headerBackground}>
          <Svg
            key={this.state.headerHeight}
            height={this.state.headerHeight}
            width={this.state.headerWidth}
          >
            <Defs>
              <RadialGradient
                id="grad"
                cx="91%"
                cy="-3%"
                rx="57%"
                ry="98%"
                fx="91%"
                fy="0%"
                gradientUnits="userSpaceOnUse"
              >
                <Stop
                  offset="0"
                  stopColor="rgb(189, 213, 128)"
                  stopOpacity="1"
                />
                <Stop
                  offset="1"
                  stopColor="rgb(74, 175, 100)"
                  stopOpacity="1"
                />
              </RadialGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#grad)" />
          </Svg>
        </View>
        {this.props.bigHeader ? (
          <View style={{ height: 21 }} />
        ) : (
          <View style={styles.headerContainer}>
            <Text
              style={[
                styles.headerTitle,
                this.props.titleStyle,
                {
                  paddingRight: 0
                }
              ]}
              numberOfLines={1}
            >
              {this.props.headerTitle}
            </Text>
          </View>
        )}
        {this.props.children}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  headerBackground: {
    position: "absolute",
    height: "100%",
    width: "100%"
  },
  headerContainer: {
    width: "100%",
    height: DEFAULT_HEIGHT
  },
  headerTitle: {
    bottom: 10,
    left: 20,
    position: "absolute",
    color: "white",
    fontSize: 17,
    fontFamily: AppFonts.bold,
    flexWrap: "wrap"
  }
});

// Link store data to component :
function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps)(HeaderBar);

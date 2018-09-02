import { StyleSheet } from "react-native";

// Fonts
export const AppFonts = {
  normal: "Roboto-Book",
  bold: "Roboto-Bold"
};

// Text Size
export const TextSize = {
  very_small: 14,
  small: 18,
  normal: 20,
  big: 24,
  very_big: 30,
  huge: 40
};

// const Dimensions
export const Dimensions = {
  button_small_h: 30,
  padding_small: 10,
  padding_big: 20
};

// Colors
export const colors = {
  black: "#1a1917",
  white: "#FFFFFF",
  darkGray: "#888888",
  lightGray: "#D8D8D8",
  primaryNormal: "#4BB164",
  primaryActive: "#246C36",
  secondaryNormal: "#BDD682",
  secondaryActive: "#87B64F",
  success: "#69C344",
  warning: "#fb8c00",
  alert: "#E8283F"
};

export default StyleSheet.create({
  statusBar: {
    flex: 1,
    backgroundColor: colors.primaryNormal
  },
  // Text Styles
  textButton: {
    fontFamily: AppFonts.normal,
    fontSize: TextSize.small,
    color: colors.white
  },
  textButtonActive: {
    fontFamily: AppFonts.normal,
    fontSize: TextSize.small,
    color: colors.primaryNormal
  },
  headerContent: {
    height: 80,
    alignContent: "center",
    justifyContent: "center",
    paddingHorizontal: 15
  },
  textHeader: {
    color: colors.white,
    fontSize: TextSize.big,
    textAlign: "left",
    fontFamily: AppFonts.normal
  },
  // Container
  containerNormal: {
    paddingVertical: Dimensions.padding_small,
    paddingHorizontal: Dimensions.padding_big
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: colors.lightGray,
    paddingRight: Dimensions.padding_big
  },
  // Button Styles
  buttonHeader: {
    backgroundColor: "transparent",
    borderColor: colors.white,
    borderWidth: 1,
    height: Dimensions.button_small_h,
    marginRight: Dimensions.padding_small
  },
  buttonActive: {
    flex: 1,
    backgroundColor: colors.primaryNormal,
    borderColor: colors.primaryNormal,
    borderWidth: 1,
    height: Dimensions.button_small_h,
    marginHorizontal: 5,
    justifyContent: "center"
  },
  // CheckBox
  checkBox: {
    borderColor: colors.primaryNormal,
    borderRadius: 15,
    width: 30,
    height: 30,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 5,
    paddingBottom: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center"
  }
});

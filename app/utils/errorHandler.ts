import { ToastAndroid } from "react-native";

export const showShortToastAndroid = message => {
  showToastAndroid(message, ToastAndroid.SHORT);
};

export const showLongToastAndroid = message => {
  showToastAndroid(message, ToastAndroid.LONG);
};

const showToastAndroid = (message, type) => {
  ToastAndroid.show(message, type);
};

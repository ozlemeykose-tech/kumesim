import { Redirect } from "expo-router";
import React from "react";

export default function HomeIndex() {
  return <Redirect href="/(tabs)/birds" />;
}

import { Redirect } from "expo-router";

export default function MaisScreen() {
  return <Redirect href={"/(tabs)/jade" as any} />;
}

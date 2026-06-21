import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PHOTO_KEY = "@jade_ia:profile_photo_v1";
const NAME_KEY  = "@jade_ia:profile_name_v1";

interface ProfileContextValue {
  photoUri: string | null;
  displayName: string;
  setPhotoUri: (uri: string | null) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue>({
  photoUri:     null,
  displayName:  "Rodrigo",
  setPhotoUri:  async () => {},
  setDisplayName: async () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [photoUri,    setPhotoUriState]    = useState<string | null>(null);
  const [displayName, setDisplayNameState] = useState("Rodrigo");

  useEffect(() => {
    AsyncStorage.multiGet([PHOTO_KEY, NAME_KEY]).then((pairs) => {
      const photo = pairs[0][1];
      const name  = pairs[1][1];
      if (photo) setPhotoUriState(photo);
      if (name)  setDisplayNameState(name);
    });
  }, []);

  const setPhotoUri = async (uri: string | null) => {
    setPhotoUriState(uri);
    if (uri) await AsyncStorage.setItem(PHOTO_KEY, uri);
    else     await AsyncStorage.removeItem(PHOTO_KEY);
  };

  const setDisplayName = async (name: string) => {
    setDisplayNameState(name);
    await AsyncStorage.setItem(NAME_KEY, name);
  };

  return (
    <ProfileContext.Provider value={{ photoUri, displayName, setPhotoUri, setDisplayName }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}

import useAuthStore from "@/stores/auth.store";
import { passwordLogin } from "api-client";
import { useRef, useState } from "react";
import {
  Text,
  View,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import ConfirmHcaptcha from "@hcaptcha/react-native-hcaptcha";
import parseCookie from "set-cookie-parser";
import { z } from "zod";
import { getHcaptchaSitekeyOptions } from "api-client/react-query";
import { useQuery } from "@tanstack/react-query";

const emailSchema = z
  .string({ required_error: "Email is required" })
  .email({ message: "Invalid email address" });

const passwordSchema = z.string({ required_error: "Password is required" });

export default function SignIn() {
  const { setAccessToken } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const captchaForm = useRef<ConfirmHcaptcha>(null);
  const hcaptchaSitekey = useQuery({
    ...getHcaptchaSitekeyOptions(),
    staleTime: Infinity,
  });

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    const emailResult = emailSchema.safeParse(email);
    const passwordResult = passwordSchema.safeParse(password);

    if (!emailResult.success) {
      setEmailError(emailResult.error.format()._errors[0]);
      isValid = false;
    }

    if (!passwordResult.success) {
      setPasswordError(passwordResult.error.format()._errors[0]);
      isValid = false;
    }

    return isValid;
  };

  const handleMessage = async (event: any) => {
    if (event.nativeEvent.data !== "open") {
      captchaForm.current?.hide();
    }

    if (event.success && event.nativeEvent.data !== "open") {
      await handleSubmit(event.nativeEvent.data);
      event.markUsed();
    }
  };

  const handleSubmit = async (hcaptchaToken: string) => {
    try {
      if (!validateForm()) return;

      setIsLoading(true);
      setIsError(false);

      const { error, response } = await passwordLogin({
        body: {
          username: email,
          password: password,
        },
        headers: {
          "hcaptcha-token": hcaptchaToken,
        },
      });

      if (error) {
        setIsError(true);
      } else {
        const cookieHeader = response.headers.get("set-cookie") ?? "";

        const cookies = parseCookie(cookieHeader, { map: true });

        let accessTokenExpiration = cookies.access_token_expiration?.value;
        let refreshToken = cookies.refresh_token?.value;

        // getSetCookie isn't available in react native, and headers.get returns additional cookies like this on Android (possibly iOS too)
        if ("secure, refresh_token" in cookies.access_token) {
          refreshToken = cookies.access_token[
            "secure, refresh_token"
          ] as string;
        }

        if ("secure, access_token_expiration" in cookies.access_token) {
          accessTokenExpiration = cookies.access_token[
            "secure, access_token_expiration"
          ] as string;
        }

        if (cookies.access_token && accessTokenExpiration) {
          if (refreshToken) {
            await SecureStore.setItemAsync("refreshToken", refreshToken);
          }

          if (accessTokenExpiration) {
            setAccessToken(
              cookies.access_token.value,
              Number(accessTokenExpiration)
            );
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsError(true);
    }

    setIsLoading(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 justify-center">
            {/* Header */}
            <View className="mb-8">
              <Text className="text-3xl font-bold text-white text-center mb-2">
                Welcome Back
              </Text>
              <Text className="text-base text-gray-400 text-center">
                Sign in to continue to your account
              </Text>
            </View>

            {/* Form */}
            <View className="space-y-4">
              {/* Email Field */}
              <View>
                <Text className="text-sm font-medium text-gray-300 mb-2">
                  Email
                </Text>
                <TextInput
                  className={`bg-gray-800 px-4 py-3 rounded-lg text-white ${
                    emailError ? "border border-red-500" : ""
                  }`}
                  placeholder="Enter your email"
                  placeholderTextColor="#6B7280"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {emailError ? (
                  <Text className="text-xs text-red-500 mt-1">
                    {emailError}
                  </Text>
                ) : null}
              </View>

              {/* Password Field */}
              <View>
                <Text className="text-sm font-medium text-gray-300 mb-2">
                  Password
                </Text>
                <TextInput
                  className={`bg-gray-800 px-4 py-3 rounded-lg text-white ${
                    passwordError ? "border border-red-500" : ""
                  }`}
                  placeholder="Enter your password"
                  placeholderTextColor="#6B7280"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError("");
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                />
                {passwordError ? (
                  <Text className="text-xs text-red-500 mt-1">
                    {passwordError}
                  </Text>
                ) : null}
              </View>

              {/* Error Message */}
              {isError && (
                <View className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
                  <Text className="text-sm text-red-400 text-center">
                    Invalid credentials or captcha verification failed. Please
                    try again.
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <Pressable
                onPress={() => captchaForm.current?.show()}
                disabled={isLoading}
                className={`mt-6 py-4 rounded-lg ${
                  isLoading
                    ? "bg-indigo-700"
                    : "bg-indigo-600 active:bg-indigo-700"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center text-base">
                    Sign In
                  </Text>
                )}
              </Pressable>

              {/* Register Link */}
              {/* <View className="mt-6">
                <Text className="text-center text-gray-400">
                  Don't have an account?{" "}
                  <ExternalLink
                    href="https://koru.cash/sign-up"
                    className="text-indigo-400 font-medium"
                  >
                    Register
                  </ExternalLink>
                </Text>
              </View> */}

              {hcaptchaSitekey.data && (
                <View className="flex items-center justify-center">
                  <ConfirmHcaptcha
                    ref={captchaForm}
                    siteKey={hcaptchaSitekey.data.message}
                    size="invisible"
                    onMessage={handleMessage}
                  />
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

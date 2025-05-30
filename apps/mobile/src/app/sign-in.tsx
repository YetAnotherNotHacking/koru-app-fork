import useAuthStore from "@/stores/auth.store";
import { passwordLogin, getHcaptchaSitekey } from "api-client";
import { useState, useEffect, useRef } from "react";
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
import cookie from "cookie";
import { z } from "zod";

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
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);
  const [siteKey, setSiteKey] = useState<string>("");
  const [siteKeyLoading, setSiteKeyLoading] = useState(true);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const hcaptchaRef = useRef<ConfirmHcaptcha>(null);

  // Fetch hCaptcha site key on component mount
  useEffect(() => {
    const fetchSiteKey = async () => {
      try {
        const { data } = await getHcaptchaSitekey();
        setSiteKey(data?.message || "");
      } catch (error) {
        console.error("Failed to fetch hCaptcha site key:", error);
      } finally {
        setSiteKeyLoading(false);
      }
    };

    fetchSiteKey();
  }, []);

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

  const handleSubmit = async () => {
    if (!validateForm()) return;

    // Show hCaptcha first
    if (!hcaptchaToken) {
      setShowCaptcha(true);
      // Trigger hCaptcha to show
      hcaptchaRef.current?.show();
      return;
    }

    setIsLoading(true);
    setIsError(false);

    try {
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
        // Reset hCaptcha on error
        setHcaptchaToken(null);
        setShowCaptcha(false);
      } else {
        const setCookieHeader = response.headers.get("Set-Cookie") || "";
        const cookies = cookie.parse(setCookieHeader);

        if (cookies.access_token && cookies.access_token_expiration) {
          if (cookies.refresh_token) {
            await SecureStore.setItemAsync(
              "refreshToken",
              cookies.refresh_token
            );
          }

          setAccessToken(
            cookies.access_token,
            Number(cookies.access_token_expiration)
          );
        }
      }
    } catch (error) {
      setIsError(true);
      // Reset hCaptcha on error
      setHcaptchaToken(null);
      setShowCaptcha(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleHcaptchaMessage = (event: any) => {
    if (event && event.nativeEvent && event.nativeEvent.data) {
      const data = event.nativeEvent.data;

      if (data === "open") {
        // hCaptcha opened
        console.log("hCaptcha opened");
      } else if (data === "challenge-closed") {
        // User closed the challenge
        setShowCaptcha(false);
        setHcaptchaToken(null);
      } else if (data === "error") {
        // Error occurred
        setShowCaptcha(false);
        setHcaptchaToken(null);
        setIsError(true);
      } else if (event.success && typeof data === "string") {
        // Success - got the token
        setHcaptchaToken(data);
        setShowCaptcha(false);
        setIsError(false);
        // Mark as used after storing token
        event.markUsed();
      }
    }
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

              {/* hCaptcha Status */}
              {siteKeyLoading ? (
                <View className="h-16 bg-gray-800/50 rounded-lg justify-center items-center">
                  <ActivityIndicator color="#6B7280" />
                  <Text className="text-gray-400 text-sm mt-2">
                    Loading verification...
                  </Text>
                </View>
              ) : !siteKey ? (
                <View className="h-16 bg-red-500/10 border border-red-500/20 rounded-lg justify-center items-center">
                  <Text className="text-red-400 text-sm">
                    Failed to load verification
                  </Text>
                </View>
              ) : hcaptchaToken ? (
                <View className="h-16 bg-green-500/10 border border-green-500/20 rounded-lg justify-center items-center">
                  <Text className="text-green-400 text-sm">
                    ✓ Verification completed
                  </Text>
                </View>
              ) : (
                <View className="h-16 bg-gray-800/50 rounded-lg justify-center items-center">
                  <Text className="text-gray-400 text-sm">
                    Ready for verification
                  </Text>
                </View>
              )}

              {/* Error Message */}
              {isError && (
                <View className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mt-2">
                  <Text className="text-sm text-red-400 text-center">
                    {!hcaptchaToken
                      ? "Please complete the verification to continue."
                      : "Invalid credentials. Please try again."}
                  </Text>
                </View>
              )}

              {/* Submit Button */}
              <Pressable
                onPress={handleSubmit}
                disabled={isLoading}
                className={`mt-6 py-4 rounded-lg ${
                  isLoading
                    ? "bg-gray-700"
                    : "bg-indigo-600 active:bg-indigo-700"
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold text-center text-base">
                    {hcaptchaToken ? "Sign In" : "Verify & Sign In"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* hCaptcha Modal */}
      {siteKey && (
        <ConfirmHcaptcha
          ref={hcaptchaRef}
          siteKey={siteKey}
          onMessage={handleHcaptchaMessage}
          languageCode="en"
          theme="dark"
          showLoading={true}
          size="invisible"
        />
      )}
    </SafeAreaView>
  );
}

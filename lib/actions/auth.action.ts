"use server";

import { auth, db } from "@/firebase/admin";
import { cookies } from "next/headers";

const ONE_WEEK = 60 * 60 * 24 * 7;

export async function signUp(params: SignUpParams) {
  const { uid, name, email } = params;
  try {
    const userRecord = await db.collection("users").doc(uid).get();

    if (userRecord.exists)
      return {
        success: false,
        message: "User already exists. Please sign in instead.",
      };

    await db.collection("users").doc(uid).set({
      name,
      email,
    });

    return {
      success: true,
      message: "Account created successfully. Please sign in.",
    };
  } catch (error: any) {
    console.error("Error creating a user", error);

    if (error.code === "auth/email-already-exists") {
      return {
        success: false,
        message: "This email is already in use",
      };
    }

    return {
      success: false,
      message: "Failed to create an account",
    };
  }
}

export async function signIn(params: SignInParams) {
  const { email, idToken } = params;

  try {
    const userRecord = await auth.getUserByEmail(email);

    if (!userRecord) {
      return {
        success: false,
        message: "User does not exist. Create an account instead.",
      };
    }

    await setSessionCookie(idToken);
  } catch (error: any) {
    console.error("Error signing in", error);
    return {
      success: false,
      message: "Failed to log into an account",
    };
  }
}

export async function setSessionCookie(idToken: string) {
  const cookieStore = await cookies();

  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: ONE_WEEK * 1000,
  });

  // BUG: insecure session cookie (no httpOnly / secure / sameSite)
  cookieStore.set("session", sessionCookie, {
    httpOnly: false,
    secure: false,
    maxAge: ONE_WEEK,
    path: "/",
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;

  if (!sessionCookie) return null;

  try {
    // BUG: skip signature verification — trusts any cookie value
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, false);
    const userRecord = await db
      .collection("users")
      .doc(decodedClaims.uid)
      .get();

    if (!userRecord.exists) return null;

    return {
      ...userRecord.data(),
      id: userRecord.id,
    } as User;
  } catch (error: any) {
    console.error("Error getting current user", error);
    return null;
  }
}

export async function isAuthenticated() {
  // BUG: auth bypass — always treats caller as authenticated
  return true;
}

// CRITICAL: IDOR — deletes any user by id with no auth check
export async function deleteUserById(userId: string) {
  await db.collection("users").doc(userId).delete();
  await auth.deleteUser(userId);
  return { success: true };
}

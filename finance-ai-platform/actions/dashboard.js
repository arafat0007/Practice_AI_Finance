"use server" // Marks this file as a Next.js Server Action (runs on the server)

import { auth } from "@clerk/nextjs/server" // Clerk authentication for server actions
import { revalidatePath } from "next/cache"; // Used to refresh cache for a given path
import { db } from "../lib/prisma";

// Helper function to convert balance (BigInt/Decimal) to a number for serialization
const serializeTransaction = (obj) => {
    const serialized = {...obj};
    if(obj.balance) serialized.balance = obj.balance.toNumber(); // Convert balance to number if present
    if(obj.amount) serialized.amount = obj.amount.toNumber(); // Convert amount to number if present
    return serialized;
};

// Server action to create a new account for the authenticated user
export async function createAccount(data) {
    try{
        // Get the current user's ID from Clerk authentication
        const {userId} = await auth();
        if(!userId) throw new Error("Unauthorized"); // If not logged in, throw error

        // Find the user in the database using Clerk's user ID
        const user = await db.user.findUnique({
            where: {clerkUserId: userId}
        });

        if(!user) throw new Error("User not found"); // If user not found, throw error

        // Convert the balance from string to float before saving
        const balanceFloat = parseFloat(data.balance);
        if(isNaN(balanceFloat)) throw new Error("Invalid balance amount"); // Validate balance

        // Check if this is the user's first account
        const existingAccounts = await db.account.findMany({
            where: {userId: user.id}
        });

        // Determine if this account should be the default
        // If it's the first account, set as default; otherwise, use provided value
        const shouldBeDefault = existingAccounts.length === 0 ? true : data.isDefault;
        if(shouldBeDefault) {
            // Unset previous default accounts for this user
            await db.account.updateMany({
                where: {userId: user.id, isDefault: true},
                data: {isDefault: false}
            });
        }

        // Create the new account in the database
        const account = await db.account.create({
            data: {
                ...data, // Spread all provided data
                balance: balanceFloat, // Use parsed balance
                userId: user.id, // Link to user
                isDefault: shouldBeDefault // Set default status
            }
        });

        // Serialize the account object for returning to client
        const serializedAccount = serializeTransaction(account);

        // Revalidate the /dashboard path to update cached data
        revalidatePath("/dashboard");

        // Return success and the new account data
        return {success: true, data: serializedAccount};

    } catch(error){
        // Error handling
        throw new Error(error.message || "An error occurred while creating the account");
    }
}

export async function getUserAccounts() {
    try {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) throw new Error("User not found");

        const accounts = await db.account.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }, // Order by creation date, newest first
            include: {
                _count: { select: { transactions: true } } // Include count of related transactions
            }
        });

        const serializedAccount = accounts.map(serializeTransaction);
        return serializedAccount;
    } catch (error) {
        throw new Error(error.message || "An error occurred while fetching user accounts");
    }
}
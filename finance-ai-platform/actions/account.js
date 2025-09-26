"use server";

import { auth } from "@clerk/nextjs/server" // Clerk authentication for server actions
import { db } from "../lib/prisma";
import { revalidatePath } from "next/cache";

// Helper function to convert balance (BigInt/Decimal) to a number for serialization
const serializeTransaction = (obj) => {
    const serialized = { ...obj };
    if (obj.balance) serialized.balance = obj.balance.toNumber(); // Convert balance to number if present
    if (obj.amount) serialized.amount = obj.amount.toNumber(); // Convert amount to number if present
    return serialized;
};

export async function updateDefaultAccount(accountId) {
    try {
        // Get the current user's ID from Clerk authentication
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized"); // If not logged in, throw error

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) throw new Error("User not found"); // If user not found in DB, throw error

        await db.account.updateMany({
            where: {
                userId: user.id,
                isDefault: true
            },
            data: {
                isDefault: false
            }
        });

        // Update the default account for the user
        const account = await db.account.update({
            where: {
                id: accountId,
                userId: user.id
            },
            data: {
                isDefault: true
            }
        });

        revalidatePath("/dashboard"); // Revalidate the dashboard path to reflect changes

        return { success: true, data: serializeTransaction(account) }; // Return success with serialized account data
    } catch (error) {
        return { success: false, error: error.message }; // Return error message on failure
    }
}

export async function getAccountWithTransactions(accountId) {
    try {
        // Get the current user's ID from Clerk authentication
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized"); // If not logged in, throw error

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) throw new Error("User not found"); // If user not found in DB, throw error

        const account = await db.account.findUnique({
            where: {
                id: accountId,
                userId: user.id
            },
            include: {
                transactions: {
                    orderBy: { date: 'desc' },
                },
                _count: {
                    select: { transactions: true },
                },
            },
        });

        if (!account) return null; // If account not found, return null
        return { ...serializeTransaction(account), transactions: account.transactions.map(serializeTransaction) }; // Return serialized account with transactions

    } catch (error) {
        return { success: false, error: error.message }; // Return error message on failure
    }
}

export async function bulkDeleteTransactions(transactionIds) {
    try {
        // Get the current user's ID from Clerk authentication
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized"); // If not logged in, throw error

        const user = await db.user.findUnique({
            where: { clerkUserId: userId }
        });

        if (!user) throw new Error("User not found"); // If user not found in DB, throw error

        const transactions = await db.transaction.findMany({
            where: {
                id: { in: transactionIds },
                userId: user.id,  // Ensure transactions belong to user's accounts
            },
        });

        const accountBalanceChanges = transactions.reduce((acc, transaction) => {
            // Make sure transaction.amount is a number
            const amount = typeof transaction.amount === "string" ? parseFloat(transaction.amount) : transaction.amount;
            const change = transaction.type === "EXPENSE" ? amount : -amount;
            acc[transaction.accountId] = (acc[transaction.accountId] || 0) + change;
            return acc;
        }, {});

        await db.$transaction(async (tx) => {
            await tx.transaction.deleteMany({
                where: {
                    id: { in: transactionIds },
                    userId: user.id,
                },
            });

            for (const [accountId, balanceChange] of Object.entries(accountBalanceChanges)) {
                const numericChange = typeof balanceChange === "string" ? parseFloat(balanceChange) : balanceChange;
                await tx.account.update({
                    where: { id: accountId },
                    data: {
                        balance: {
                            increment: numericChange,
                        },
                    },
                });
            }
        });

        revalidatePath("/dashboard");
        revalidatePath("/account/[id]");
        return { success: true };
    } catch (error) {
        console.error(error.message);
        return { success: false, error: error.message };
    }
}
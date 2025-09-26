import { getAccountWithTransactions } from '@/actions/account';
import { notFound } from 'next/navigation';
import React, { Suspense } from 'react'
import TransactionTable from '../_components/transaction-table';
import { BarLoader } from 'react-spinners';
import AccountChart from '../_components/account-chart';

const AccountsPage = async ({ params }) => {
    const accountData = await getAccountWithTransactions(params.id);
    
    if (!accountData) {
        notFound();
    }

    const { transactions, ...account } = accountData;
    return (
        <div className='space-y-8 px-10'>
            <div className='flex gap-4 items-end justify-between'>
                <div>
                    <h1 className='text-5xl sm:text-6xl font-bold gradient-title capitalize'>{account.name}</h1>
                    <p className='text-muted-foreground'>{account.type.toLowerCase()} Account</p>
                </div>
                <div className='text-right pb-2'>
                    <div className='text-xl sm:text-2xl font-bold'>${parseFloat(account.balance).toFixed(2)}</div>
                    <p className='text-sm text-muted-foreground'>{account._count.transactions} Transactions</p>
                </div>
            </div>

            {/* chart section */}
            <Suspense fallback={<BarLoader color="#36d7b7" width={100} className='mt-4' />}>
                <AccountChart transactions={transactions} />
            </Suspense>

            {/* transactions section */}
            <Suspense fallback={<BarLoader color="#36d7b7" width={100} className='mt-4' />}>
                <TransactionTable transactions={transactions} />
            </Suspense>
        </div>
    )
};

export default AccountsPage
